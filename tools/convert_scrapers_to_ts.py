#!/usr/bin/env python3
"""Generate TypeScript Playwright scraper modules from the existing Python scrapers."""

from __future__ import annotations

import argparse
import ast
import textwrap
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple


SCRAPER_INIT = Path("Scrapers") / "__init__.py"
SCRAPER_DIR = Path("Scrapers")
DEFAULT_TS_DIR = Path("ts-scrapers/src/sites")


def slugify(value: str) -> str:
    slug = "".join(ch if ch.isalnum() else "-" for ch in value.lower())
    slug = "-".join(filter(None, slug.split("-")))
    return slug or "scraper"


def ts_string(value: Optional[str]) -> str:
    if value is None:
        return ""
    return value.replace("\\", "\\\\").replace("'", "\\'")


def literal_or_none(node: ast.AST):
    try:
        return ast.literal_eval(node)
    except Exception:
        return None


def base_name(node: ast.expr) -> str:
    if isinstance(node, ast.Name):
        return node.id
    if isinstance(node, ast.Attribute):
        return node.attr
    return "BaseScraper"


def read_search_source(source: str, func: ast.FunctionDef) -> str:
    segment = ast.get_source_segment(source, func) or ""
    return textwrap.dedent(segment).strip()


@dataclass
class SuperCall:
    args: List[object] = field(default_factory=list)
    kwargs: Dict[str, object] = field(default_factory=dict)


@dataclass
class ScraperSpec:
    class_name: str
    module: str
    base_class: str
    docstring: str
    source_path: Path
    slug: str
    super_call: Optional[SuperCall]
    attributes: Dict[str, object]
    search_source: Optional[str]

    @property
    def display_name(self) -> str:
        if self.super_call and self.super_call.args:
            # BaseScraper takes base_url, name
            if len(self.super_call.args) >= 2 and isinstance(self.super_call.args[1], str):
                return self.super_call.args[1]
        if self.super_call and "name" in self.super_call.kwargs:
            value = self.super_call.kwargs["name"]
            if isinstance(value, str):
                return value
        return self.class_name

    @property
    def base_url(self) -> str:
        if self.super_call:
            if self.super_call.args and isinstance(self.super_call.args[0], str):
                return self.super_call.args[0]
            if "base_url" in self.super_call.kwargs and isinstance(self.super_call.kwargs["base_url"], str):
                return self.super_call.kwargs["base_url"]
        return ""


class ScraperParser:
    def __init__(self, module: str, class_name: str, path: Path):
        self.module = module
        self.class_name = class_name
        self.path = path
        self.source = path.read_text(encoding="utf-8")
        self.tree = ast.parse(self.source, filename=str(path))

    def parse(self) -> ScraperSpec:
        class_node = next(
            node for node in self.tree.body if isinstance(node, ast.ClassDef) and node.name == self.class_name
        )
        docstring = ast.get_docstring(class_node) or ""
        base_name_value = base_name(class_node.bases[0]) if class_node.bases else "BaseScraper"
        super_call = self._find_super_call(class_node)
        attrs = self._collect_assignments(class_node)
        search_source = self._extract_search_source(class_node)
        slug = slugify(self.module)

        if super_call:
            name_hint = None
            if "name" in super_call.kwargs:
                name_hint = super_call.kwargs.get("name")
            elif len(super_call.args) >= 2:
                name_hint = super_call.args[1]
            if isinstance(name_hint, str):
                slug = slugify(name_hint)

        return ScraperSpec(
            class_name=self.class_name,
            module=self.module,
            base_class=base_name_value,
            docstring=docstring,
            source_path=self.path,
            slug=slug,
            super_call=super_call,
            attributes=attrs,
            search_source=search_source,
        )

    def _find_super_call(self, class_node: ast.ClassDef) -> Optional[SuperCall]:
        init_fn = next(
            (node for node in class_node.body if isinstance(node, ast.FunctionDef) and node.name == "__init__"), None
        )
        if not init_fn:
            return None
        for stmt in init_fn.body:
            call = None
            if isinstance(stmt, ast.Expr) and isinstance(stmt.value, ast.Call):
                call = stmt.value
            elif isinstance(stmt, ast.AnnAssign) and isinstance(stmt.value, ast.Call):
                call = stmt.value
            if not call:
                continue
            func = call.func
            if (
                isinstance(func, ast.Attribute)
                and func.attr == "__init__"
                and isinstance(func.value, ast.Call)
                and isinstance(func.value.func, ast.Name)
                and func.value.func.id == "super"
            ):
                args = [literal_or_none(arg) for arg in call.args]
                kwargs = {kw.arg: literal_or_none(kw.value) for kw in call.keywords if kw.arg}
                return SuperCall(args=args, kwargs=kwargs)
        return None

    def _collect_assignments(self, class_node: ast.ClassDef) -> Dict[str, object]:
        attrs: Dict[str, object] = {}
        for node in class_node.body:
            if isinstance(node, ast.FunctionDef) and node.name == "__init__":
                for stmt in node.body:
                    if isinstance(stmt, ast.Assign):
                        value = literal_or_none(stmt.value)
                        for target in stmt.targets:
                            if (
                                isinstance(target, ast.Attribute)
                                and isinstance(target.value, ast.Name)
                                and target.value.id == "self"
                                and isinstance(target.attr, str)
                            ):
                                if value is not None:
                                    attrs[target.attr] = value
        return attrs

    def _extract_search_source(self, class_node: ast.ClassDef) -> Optional[str]:
        for node in class_node.body:
            if isinstance(node, ast.AsyncFunctionDef) and node.name == "search":
                return read_search_source(self.source, node)
        return None


def parse_exports(init_path: Path) -> List[Tuple[str, str]]:
    content = init_path.read_text(encoding="utf-8")
    tree = ast.parse(content, filename=str(init_path))
    export_names: List[str] = []
    module_map: Dict[str, str] = {}

    for node in tree.body:
        if isinstance(node, ast.ImportFrom) and node.module:
            module_name = node.module.lstrip(".")
            for alias in node.names:
                module_map[alias.name] = module_name
        elif isinstance(node, ast.Assign):
            for target in node.targets:
                if isinstance(target, ast.Name) and target.id == "__all__":
                    if isinstance(node.value, (ast.List, ast.Tuple)):
                        for elt in node.value.elts:
                            if isinstance(elt, ast.Constant) and isinstance(elt.value, str):
                                export_names.append(elt.value)
    exports = []
    for name in export_names:
        module = module_map.get(name)
        if module:
            exports.append((module, name))
    return exports


class TemplateRenderer:
    def __init__(self, out_dir: Path):
        self.out_dir = out_dir
        self.out_dir.mkdir(parents=True, exist_ok=True)

    def render(self, spec: ScraperSpec) -> Path:
        template = self._select_template(spec)
        content = template(spec)
        target = self.out_dir / f"{spec.module}.ts"
        target.write_text(content, encoding="utf-8")
        return target

    def _select_template(self, spec: ScraperSpec):
        base = spec.base_class
        if base == "AshopCategoryScraper":
            return self._render_ashop
        if base == "StarwebSearchScraper":
            return self._render_starweb
        if base == "WooCommerceStoreScraper":
            return self._render_woocommerce
        if base == "ShopifyCollectionScraper":
            return self._render_shopify
        return self._render_base_scraper

    def _render_ashop(self, spec: ScraperSpec) -> str:
        category_url = (
            spec.super_call.kwargs.get("category_url")
            if spec.super_call and "category_url" in spec.super_call.kwargs
            else spec.attributes.get("category_url")
        )
        template = f"""
import {{ AshopCategoryScraper }} from '../bases/ashop.js';

export class {spec.class_name} extends AshopCategoryScraper {{
  constructor() {{
    super({{
      name: '{ts_string(spec.display_name)}',
      baseUrl: '{ts_string(spec.base_url)}',
      categoryUrl: '{ts_string(category_url or '')}',
      slug: '{ts_string(spec.slug)}',
    }});
  }}
}}
"""
        return textwrap.dedent(template).strip() + "\n"

    def _render_starweb(self, spec: ScraperSpec) -> str:
        template = f"""
import {{ StarwebSearchScraper }} from '../bases/starweb.js';

export class {spec.class_name} extends StarwebSearchScraper {{
  constructor() {{
    super({{
      name: '{ts_string(spec.display_name)}',
      baseUrl: '{ts_string(spec.base_url)}',
      slug: '{ts_string(spec.slug)}',
    }});
  }}
}}
"""
        return textwrap.dedent(template).strip() + "\n"

    def _render_woocommerce(self, spec: ScraperSpec) -> str:
        template = f"""
import {{ WooCommerceStoreScraper }} from '../bases/woocommerce.js';

export class {spec.class_name} extends WooCommerceStoreScraper {{
  constructor() {{
    super({{
      name: '{ts_string(spec.display_name)}',
      baseUrl: '{ts_string(spec.base_url)}',
      slug: '{ts_string(spec.slug)}',
    }});
  }}
}}
"""
        return textwrap.dedent(template).strip() + "\n"

    def _render_shopify(self, spec: ScraperSpec) -> str:
        collection_path = (
            spec.super_call.kwargs.get("collection_path")
            if spec.super_call and "collection_path" in spec.super_call.kwargs
            else spec.attributes.get("collection_path")
        )
        template = f"""
import {{ ShopifyCollectionScraper }} from '../bases/shopify.js';

export class {spec.class_name} extends ShopifyCollectionScraper {{
  constructor() {{
    super({{
      name: '{ts_string(spec.display_name)}',
      baseUrl: '{ts_string(spec.base_url)}',
      collectionPath: '{ts_string(collection_path or '')}',
      slug: '{ts_string(spec.slug)}',
    }});
  }}
}}
"""
        return textwrap.dedent(template).strip() + "\n"

    def _render_base_scraper(self, spec: ScraperSpec) -> str:
        comment = ""
        if spec.search_source:
            comment = "\n/* Python reference:\n" + textwrap.indent(spec.search_source, "  ") + "\n*/"
        template = f"""
import {{ Page }} from '@playwright/test';
import {{ BaseSiteScraper }} from '../base.js';
import {{ ListingResult, SearchParams }} from '../types.js';

export class {spec.class_name} extends BaseSiteScraper {{
  constructor() {{
    super({{
      name: '{ts_string(spec.display_name)}',
      baseUrl: '{ts_string(spec.base_url)}',
      slug: '{ts_string(spec.slug)}',
    }});
  }}

  async search(page: Page, params: SearchParams): Promise<ListingResult[]> {{
    throw new Error('{spec.class_name}.search has not been ported to TypeScript yet.');
  }}
}}
{comment}
"""
        return textwrap.dedent(template).strip() + "\n"


def write_index(out_dir: Path, specs: List[ScraperSpec]) -> None:
    lines = ["import { SiteScraper } from '../types.js';"]
    for spec in specs:
        lines.append(f"import {{ {spec.class_name} }} from './{spec.module}.js';")
    lines.append("")
    lines.append("export const siteScrapers: SiteScraper[] = [")
    for spec in specs:
        lines.append(f"  new {spec.class_name}(),")
    lines.append("];")
    (out_dir / "index.ts").write_text("\n".join(lines) + "\n", encoding="utf-8")


def main():
    parser = argparse.ArgumentParser(description="Generate TypeScript scraper classes.")
    parser.add_argument(
        "--out-dir",
        dest="out_dir",
        default=DEFAULT_TS_DIR,
        type=Path,
        help="Where to place generated TypeScript files (default: ts-scrapers/src/sites)",
    )
    parser.add_argument(
        "--src",
        dest="src_dir",
        default=SCRAPER_DIR,
        type=Path,
        help="Path to the Python Scrapers directory (default: ./Scrapers)",
    )
    args = parser.parse_args()

    exports = parse_exports(SCRAPER_INIT)
    specs: List[ScraperSpec] = []
    for module, class_name in exports:
        path = args.src_dir / f"{module}.py"
        parser_obj = ScraperParser(module, class_name, path)
        specs.append(parser_obj.parse())

    renderer = TemplateRenderer(args.out_dir)
    generated_paths = []
    for spec in specs:
        generated_paths.append(renderer.render(spec))

    write_index(args.out_dir, specs)
    print(f"Generated {len(generated_paths)} scrapers into {args.out_dir}")


if __name__ == "__main__":
    main()
