import HtmlWebpackPlugin from "html-webpack-plugin";
import webpack from "webpack";
import parse5 from "parse5";
import TemplateGenerator, { ThemeOptions } from "./template";

const pluginName = "c5-html-plugin";

export interface C5Element {
  name: string;
  content: string;
  filename: string;
  startCom: number;
  startPos: number;
  endPos: number;
  endCom: number;
  files: string[];
}

export interface C5PluginConfig {
  themeHandle: string;
  themeName: string;
  themeDescription?: string;
  packageHandle?: string;
  defaultPage: string;
  skipIndex?: boolean;
  deleteHtml?: boolean;
}

export interface C5Area {
  name: string;
  global: boolean;
  useGrid: boolean;
  editable: boolean;
  start?: number;
  end?: number;
}

export class HtmlWebpackC5ThemePlugin {
  private hasAreaTag = false;
  private hasElement = false;
  private elements: C5Element[] = [];
  private areas: C5Area[] = [];
  private generatedTheme = false;
  private _options: C5PluginConfig = {
    themeHandle: "c5_theme",
    themeName: "Concrete5 Theme",
    defaultPage: "index.html",
    skipIndex: false,
  };

  constructor(_options: C5PluginConfig | string, private _htmlPlugin: any) {
    if (!_htmlPlugin) {
      this._htmlPlugin = HtmlWebpackPlugin;
    }
    if (typeof _options === "string") {
      this._options.themeHandle = _options.replace(/\s/gi, "_");
      this._options.themeName = _options;
    } else {
      this._options = { ...this._options, ..._options };
    }
  }

  getConcrete5Output(html: string): string {
    const document = <parse5.DefaultTreeDocumentFragment>(
      parse5.parseFragment(html, { sourceCodeLocationInfo: true })
    );

    let newHtml = "";

    this.getAreas(document);
    let prevPos = 0;
    if (this.hasAreaTag) {
      this.areas.forEach((c5a) => {
        newHtml += html.substring(prevPos, c5a.start) + this.outputAreas(c5a);
        prevPos = c5a.end ? c5a.end : 0;
      });
      this.hasAreaTag = false;
      this.areas = [];
    }
    newHtml += html.substring(prevPos, html.length);

    return newHtml;
  }

  outputAreas(area: C5Area): string {
    let areaOutput = "<?php \n";
    if (area.global) {
      areaOutput +=
        "$area = new \\Concrete\\Core\\Area\\GlobalArea('" +
        area.name +
        "');\n";
    } else {
      areaOutput +=
        "$area = new  \\Concrete\\Core\\Area\\Area('" + area.name + "');\n";
    }

    if (area.editable === false) areaOutput += "$area->disableControls();\n";

    if (area.useGrid === true) areaOutput += "$area->enableGridContainer();\n";

    areaOutput += "$area->display($c);\n";
    areaOutput += "?>";

    return areaOutput;
  }

  getAreas(document: any): boolean {
    if (document.childNodes && document.childNodes.length) {
      document.childNodes.forEach((childNode: any) => {
        if (this.isArea(childNode)) {
          this.hasAreaTag = true;
          this.getC5Area(childNode);
        } else {
          return this.getAreas(childNode);
        }
      });
    }

    return true;
  }

  isElement(comment: parse5.DefaultTreeCommentNode) {
    return (
      comment.nodeName === "#comment" &&
      comment.data.match(/^-*C5\s(?:Begin|End)/giu)
    );
  }

  getElements(document: any, filename: string): boolean {
    if (document.childNodes && document.childNodes.length) {
      document.childNodes.forEach((childNode: any) => {
        if (this.isElement(childNode)) {
          this.hasElement = true;
          this.getElement(childNode, filename);
        } else {
          return this.getElements(childNode, filename);
        }
      });
      return true;
    } else {
      return false;
    }
  }

  getElement(comment: parse5.DefaultTreeCommentNode, filename: string) {
    let element: C5Element;
    const regEx = /^-*C5\s+Begin\s+(.*)-*$/iu;
    if (regEx.test(comment.data)) {
      const res = comment.data.match(regEx);
      if (res) {
        element = {
          name: res[1].replace("-", ""),
          filename: "elements/" + res[1].replace(/\s/, "_"),
          content: "",
          startCom: comment.sourceCodeLocation
            ? comment.sourceCodeLocation.startOffset
            : 0,
          startPos: comment.sourceCodeLocation
            ? comment.sourceCodeLocation.endOffset
            : 0,
          endCom: 0,
          endPos: 0,
          files: [filename],
        };
        this.elements.push(element);
      }
    } else {
      const regEx = /^-*C5\s+End\s+(.*)-*$/iu;
      if (regEx.test(comment.data)) {
        const res = comment.data.match(regEx);
        if (res) {
          const tempName = res[1].replace("-", "");
          const newEle = this.elements.find((ele) => {
            return ele.name === tempName;
          });
          if (!newEle) {
            throw new Error("Invalid Element - No Start Tag : " + res[1]);
          }

          element = newEle;
          element.endCom = comment.sourceCodeLocation
            ? comment.sourceCodeLocation.endOffset
            : 0;
          element.endPos = comment.sourceCodeLocation
            ? comment.sourceCodeLocation.startOffset
            : 0;
          this.elements = this.elements.filter((ele) => {
            if (ele.name === element.name && !ele.files.includes(filename)) {
              element.files = [...ele.files, filename];
            }
            return ele.name !== element.name;
          });
          this.elements.push(element);
        }
      }
    }
  }

  isArea(area: parse5.DefaultTreeNode): boolean {
    return area.nodeName === "c5-area";
  }

  getElementHtml(element: C5Element, html: string): string {
    if (element.endPos === element.endCom) {
      throw new Error("Invalid Element - No End Tag : " + element.name);
    }

    element.content = "";
    element.content += html.substring(element.startPos, element.endPos);
    return (
      html.substring(0, element.startCom) +
      html.substring(element.endCom, html.length)
    );
  }

  getC5Area(area: parse5.DefaultTreeElement) {
    const c5area = {
      name: "",
      global: false,
      useGrid: false,
      editable: true,
      start: 0,
      end: 0,
    };
    if (area.attrs.length > 0) {
      area.attrs.forEach((attr) => {
        if (attr.name === "name") c5area.name = attr.value.trim();

        if (attr.name === "grid") c5area.useGrid = attr.value === "true";

        if (attr.name === "global") c5area.global = attr.value === "true";

        if (attr.name === "editable") c5area.editable = attr.value === "true";
      });
    }
    if (!c5area.name || c5area.name === "") {
      throw new Error("Invalid Area - Missing Name Tag");
    }
    c5area.start = area.sourceCodeLocation
      ? area.sourceCodeLocation.startOffset
      : 0;
    c5area.end = area.sourceCodeLocation
      ? area.sourceCodeLocation.endOffset
      : 0;

    this.areas.push(c5area);
  }

  generateThemeFile(compilation: any) {
    const config: ThemeOptions = {
      name: this._options.themeName,
      handle: this._options.themeHandle,
      description: this._options.themeDescription,
      packageHandle: this._options.packageHandle,
    };
    const generator: TemplateGenerator = new TemplateGenerator(config);

    const content: string = generator.generate();
    const eleSource = { source: () => content, size: () => content.length };
    // @ts-ignore
    if (compilation.emitAsset) {
      // @ts-ignore
      compilation.emitAsset("page_theme.php", eleSource);
    } else {
      compilation.assets["page_theme.php"] = eleSource;
    }
  }

  outputC5Theme(content: string, name: string, compilation: any) {
    const defaultPage: string = this._options.defaultPage
      ? this._options.defaultPage
      : "index.html";
    if (name.toLowerCase() === defaultPage.toLowerCase()) {
      this.outputC5Theme(content, "default", compilation);
    }
    let start = "<?php\n";
    start += "defined('C5_EXECUTE') or die('Access Denied.');\n";
    start += "/* @var \\Concrete\\Core\\Page\\View\\PageView  $view */\n";
    start += "$c = \\Concrete\\Core\\Page\\Page::getCurrentPage();?>\n";
    content = start + content;
    name = name.toLowerCase();

    const eleSource = { source: () => content, size: () => content.length };
    // @ts-ignore
    if (compilation.emitAsset) {
      // @ts-ignore
      compilation.emitAsset(name.replace(".html", "") + ".php", eleSource);
    } else {
      compilation.assets[name.replace(".html", "") + ".php"] = eleSource;
    }
  }

  apply(compiler: webpack.Compiler) {
    if (compiler.hooks) {
      // webpack 4 support
      compiler.hooks.compilation.tap(pluginName, (compilation) => {
        if (this._htmlPlugin) {
          const hooks: HtmlWebpackPlugin.Hooks = this._htmlPlugin.getHooks(
            compilation
          );

          hooks.beforeEmit.tapAsync(pluginName, (data, cb) => {
            let fileHasEles = false;
            if (
              this._options.skipIndex &&
              data.outputName.toLowerCase() === "index.html"
            ) {
              cb(undefined, data);
            } else {
              let html = "";
              try {
                if (
                  this.getElements(
                    parse5.parseFragment(data.html, {
                      sourceCodeLocationInfo: true,
                    }),
                    data.outputName
                  )
                ) {
                  this.elements.forEach((ele) => {
                    if (ele.files.includes(data.outputName)) {
                      fileHasEles = true;
                      this.getElementHtml(ele, data.html);
                      this.outputC5Theme(
                        this.getConcrete5Output(ele.content),
                        ele.filename,
                        compilation
                      );
                    }
                  });
                }
                if (!this.generatedTheme) {
                  this.generateThemeFile(compilation);
                }
                if (fileHasEles) {
                  html = this.removeElements(data.html);
                } else {
                  html = data.html;
                }
                if (this._options.deleteHtml === true) {
                  html = this.getConcrete5Output(html);
                  let start = "<?php\n";
                  start += "defined('C5_EXECUTE') or die('Access Denied.');\n";
                  start +=
                    "/* @var \\Concrete\\Core\\Page\\View\\PageView $view */\n";
                  start +=
                    "$c = \\Concrete\\Core\\Page\\Page::getCurrentPage();?>\n";
                  if (
                    this._options.defaultPage.toLowerCase() !==
                    data.outputName.toLowerCase()
                  ) {
                    data.outputName = data.outputName.replace(".html", ".php");
                  } else {
                    data.outputName = "default.php";
                  }

                  data.html = start + html;
                } else {
                  this.outputC5Theme(
                    this.getConcrete5Output(html),
                    data.outputName,
                    compilation
                  );
                }
                cb(undefined, data);
              } catch (err) {
                compilation.errors.push(err);
                cb(undefined, data);
              }
            }
          });

          hooks.afterEmit.tapAsync(pluginName, (data, cb) => {
            if (
              data.outputName.toLowerCase() === "index.html" &&
              this._options.skipIndex
            ) {
              delete compilation.assets[data.outputName];
            } else if (this._options.deleteHtml === true) {
              const asset = compilation.assets[data.outputName];
              let isDefault = false;
              delete compilation.assets[data.outputName];
              data.outputName = data.outputName.toLowerCase();
              if (
                this._options.defaultPage.toLowerCase() ===
                data.outputName.toLowerCase()
              ) {
                isDefault = true;
              }

              data.outputName = data.outputName.replace(".html", ".php");
              // @ts-ignore
              if (compilation.emitAsset) {
                // @ts-ignore
                compilation.emitAsset(data.outputName, asset);
                if (isDefault) {
                  // @ts-ignore
                  compilation.emitAsset("default.php", asset);
                }
              } else {
                if (isDefault) {
                  compilation.assets["default.php"] = asset;
                }
                compilation.assets[data.outputName] = asset;
              }
            }
            cb(undefined, data);
          });
        } else {
          throw new Error("Cannot find appropriate compilation hook");
        }
      });
    } else {
      throw new Error("Webpack 3 not supported with concrete5 plugin");
    }
  }

  removeElements(html: string) {
    let newHtml = "";
    let prevPos = 0;
    if (this.hasElement) {
      this.elements.forEach((ele) => {
        newHtml += html.substring(prevPos, ele.startCom);
        newHtml += "<?php $view->inc('" + ele.filename + ".php'); ?>";
        prevPos = ele.endCom;
      });
      newHtml += html.substring(prevPos, html.length);
      return newHtml;
    } else {
      return html;
    }
  }
}

export default HtmlWebpackC5ThemePlugin;
