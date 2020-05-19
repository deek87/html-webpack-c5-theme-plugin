export interface ThemeOptions {
  name: string;
  handle: string;
  description?: string;
  packageHandle?: string;
}

export default class TemplateGenerator {
  private _options: ThemeOptions;
  constructor(options: ThemeOptions) {
    const handleRegEx = /([A-Za-z0-9]+_?)+/iu;
    if (!options.name) {
      options.name = "Concrete5 Theme";
    }
    if (!options.handle.match(handleRegEx)) {
      throw new Error("Invalid Theme Handle");
    }
    if (options.packageHandle && !options.packageHandle.match(handleRegEx)) {
      throw new Error("Invalid Package Handle");
    }
    this._options = options;
  }

  generate(): string {
    let output = "<?php\n";

    output += this.generateNameSpace(
      this._options.handle,
      this._options.packageHandle
    );

    output += this.generateUses();

    output += this.generateClass();

    return output;
  }

  generateUses(): string {
    let uses = "\n";
    uses +=
      "use Concrete\\Core\\Area\\Layout\\Preset\\Provider\\ThemeProviderInterface;\n";
    uses += "use Concrete\\Core\\Page\\Theme\\Theme;\n";

    uses += "\n";
    return uses;
  }

  generateClass(): string {
    let classOutput = "";
    classOutput +=
      "class PageTheme extends Theme implements ThemeProviderInterface\n";
    classOutput += "{\n\n";
    classOutput += this.generateThemeName(this._options.name);
    if (this._options.description) {
      classOutput += "\n";
      classOutput += this.generateDescription(this._options.description);
      classOutput += "\n";
    }
    classOutput += "\n";
    classOutput += "}\n";
    return classOutput;
  }

  generateNameSpace(themeHandle: string, packageHandle?: string): string {
    let ns = "namespace ";

    if (packageHandle) {
      ns +=
        "Concrete\\Core\\Package\\" +
        this.camelCase(packageHandle) +
        "\\Themes\\" +
        this.camelCase(themeHandle) +
        ";\n";
    } else {
      ns += "Application\\Themes\\" + this.camelCase(themeHandle) + ";\n";
    }
    ns += "// Auto-Generated by html-webpack-c5-plugin\n";
    return ns;
  }

  camelCase(word: string): string {
    word = word.toLowerCase();
    const words = word.split("_");
    let tempWord = "";
    words.forEach((wrd) => {
      tempWord += wrd.charAt(0).toUpperCase() + wrd.slice(1);
    });

    return tempWord;
  }

  generateDescription(desc: string): string {
    let description = "    public function getThemeDescription()\n";
    description += "    {\n";
    description += "        return t('" + desc + "');\n";
    description += "    }\n";
    return description;
  }

  generateThemeName(name: string): string {
    let themeName = "    public function getThemeName()\n";
    themeName += "    {\n";
    themeName += "        return t('" + name + "');\n";
    themeName += "    }\n";
    return themeName;
  }
}
