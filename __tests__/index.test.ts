/* eslint-disable no-unused-expressions */
import webpack from "webpack";
import { join } from "path";
import { expect } from "chai";
import { readFileSync } from "fs";
import "mocha";
import HtmlWebpackC5ThemePlugin, { C5PluginConfig } from "../src/index";
import HtmlWebpackPlugin from "html-webpack-plugin";
import rimraf from "rimraf";

const outputDir = join(__dirname, "./test_dist");

const webpackConfig: webpack.Configuration = {
  mode: "development",
  entry: {
    app: join(__dirname, "./test_data/index.js"),
  },
  output: {
    path: outputDir,
  },
};

const HtmlWebpackPluginOptions = {
  filename: "index.html",
  hash: false,
  minify: false,
  showErrors: true,
  template: join(__dirname, "./test_data/index.html"),
};

const pluginConfig: C5PluginConfig = {
  themeHandle: "my_theme",
  packageHandle: "my_package", // set to null unless you want to add theme to a package
  themeName: "My C5 Theme", //
  themeDescription: undefined, // Enter a description about the package
  skipIndex: false, // Set to true if you dont want to process index.html as a php file
  defaultPage: "index.html", // This is the page that will be used for generating default.php
};

webpackConfig.mode = "production";

function getContent(filename: string): string {
  const file = join(outputDir, filename);
  const contents = readFileSync(file).toString("utf8");
  expect(!!contents).to.be.true;
  return contents;
}

describe("Testing Output", () => {
  afterEach((done) => {
    rimraf(outputDir, done);
  });
  it("should create 4 valid files", (done) => {
    webpack(
      {
        ...webpackConfig,
        plugins: [
          new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
          new HtmlWebpackC5ThemePlugin(pluginConfig, HtmlWebpackPlugin),
        ],
      },
      (err) => {
        expect(!!err).to.be.false;
        const indexContent = getContent("./default.php");
        const pageThemeContent = getContent("./page_theme.php");
        const headerElementContent = getContent("./elements/header.php");
        const footerElementContent = getContent("./elements/footer.php");
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(indexContent),
          "found remaining element tag in index"
        ).to.be.false;
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(headerElementContent),
          "found remaining element tag in header"
        ).to.be.false;
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(footerElementContent),
          "found remaining element tag in index"
        ).to.be.false;
        expect(
          /return t\('My C5 Theme'\)/i.test(pageThemeContent),
          "couldn't find matching page theme name"
        ).to.be.true;
        expect(
          /public function getThemeDescription\(\)/i.test(pageThemeContent),
          "found a description when none was given"
        ).to.be.false;
        done();
      }
    );
  });
  it("should create 5 valid files when a second file is passed", (done) => {
    webpack(
      {
        ...webpackConfig,
        plugins: [
          new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
          new HtmlWebpackPlugin({
            ...HtmlWebpackPluginOptions,
            template: join(__dirname, "./test_data/index2.html"),
            filename: "index2.html",
          }),
          new HtmlWebpackC5ThemePlugin(
            { ...pluginConfig, defaultPage: "index2.html" },
            HtmlWebpackPlugin
          ),
        ],
      },
      (err, stats) => {
        expect(!!err, "Webpack has an error").to.be.false;
        expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
        const index2Content = getContent("default.php");
        const indexContent = getContent("index.php");
        const pageThemeContent = getContent("page_theme.php");
        const headerElementContent = getContent("elements/header.php");
        const footerElementContent = getContent("elements/footer.php");
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(indexContent),
          "found remaining element tag in index"
        ).to.be.false;
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(index2Content),
          "found remaining element tag in index"
        ).to.be.false;
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(headerElementContent),
          "found remaining element tag in header"
        ).to.be.false;
        expect(
          /<!--\s*\-*C5 (?:Begin|end)/i.test(footerElementContent),
          "found remaining element tag in index"
        ).to.be.false;
        expect(
          /return t\('My C5 Theme'\)/i.test(pageThemeContent),
          "couldn't find matching page theme name"
        ).to.be.true;
        expect(
          /public function getThemeDescription\(\)/i.test(pageThemeContent),
          "found a description when none was given"
        ).to.be.false;
        done(err);
      }
    );
  });

  it("should error when given invalid area", (done) => {
    webpack(
      {
        ...webpackConfig,
        plugins: [
          new HtmlWebpackPlugin({
            ...HtmlWebpackPluginOptions,
            template: join(__dirname, "./test_data/i_area.html"),
          }),
          new HtmlWebpackC5ThemePlugin(pluginConfig, HtmlWebpackPlugin),
        ],
      },
      (err, stats) => {
        const errors: webpack.StatsError[] = stats?.toJson().errors || [];
        expect(!!err, "Webpack has an error").to.be.false;
        expect(stats?.hasErrors(), "Plugin did not error").to.be.true;
        if (errors && errors.length > 0) {
          expect(errors[0]?.message).to.contains(
            "Invalid Area - Missing Name Tag",
            "Couldnt find error"
          );
        }
        done();
      }
    );
  });
  it("should error when given an element tag without start tag", (done) => {
    webpack(
      {
        ...webpackConfig,
        plugins: [
          new HtmlWebpackPlugin({
            ...HtmlWebpackPluginOptions,
            template: join(__dirname, "./test_data/i_element.html"),
          }),
          new HtmlWebpackC5ThemePlugin(pluginConfig, HtmlWebpackPlugin),
        ],
      },
      (err, stats) => {
        expect(!!err, "Webpack has an error").to.be.false;
        const errors: webpack.StatsError[] = stats?.toJson().errors || [];
        expect(stats?.hasErrors()).to.be.true;
        if (errors && errors.length > 0) {
          expect(errors[0].message).to.contains(
            "Invalid Element - No Start Tag : Header",
            "Didnt get an error"
          );
        }
        done(err);
      }
    );
  });
  it("should error when given an element tag without end tag", (done) => {
    webpack(
      {
        ...webpackConfig,
        plugins: [
          new HtmlWebpackPlugin({
            ...HtmlWebpackPluginOptions,
            template: join(__dirname, "./test_data/i_element2.html"),
          }),
          new HtmlWebpackC5ThemePlugin(pluginConfig, HtmlWebpackPlugin),
        ],
      },
      (err, stats) => {
        const errors: webpack.StatsError[] = stats?.toJson().errors || [];
        expect(!!err, "Webpack has an error").to.be.false;
        expect(stats?.hasErrors()).to.be.true;
        if (errors && errors.length > 0) {
          expect(errors[0].message).to.contains(
            "Invalid Element - No End Tag : Header",
            "Didnt get an error"
          );
        }
        done(err);
      }
    );
  });
});

describe("Testing Input", () => {
  describe("Setting constructor options", () => {
    afterEach((done) => {
      rimraf(outputDir, done);
    });
    it("should generate the correct name and namespace with no constructor options", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin(),
          ],
        },
        (err, stats) => {
          const pageThemeContent = getContent("page_theme.php");
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(
            /return t\('Concrete5 Theme'\)/i.test(pageThemeContent),
            "couldn't find matching page theme name"
          ).to.be.true;
          expect(
            /namespace Application\\Theme\\C5Theme;/i.test(pageThemeContent),
            "generated incorrect namespace"
          ).to.be.true;
          done(err);
        }
      );
    });
    it("should generate the correct name and namespace with a string constructor", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin("Cool C5 Theme"),
          ],
        },
        (err, stats) => {
          const pageThemeContent = getContent("page_theme.php");
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(
            /return t\('Cool C5 Theme'\)/i.test(pageThemeContent),
            "couldn't find matching page theme name"
          ).to.be.true;
          expect(
            /namespace Application\\Theme\\CoolC5Theme;/i.test(
              pageThemeContent
            ),
            "generated incorrect namespace"
          ).to.be.true;
          done(err);
        }
      );
    });
    it("should generate the correct name and namespace with a package handle", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin({ packageHandle: "cool_package" }),
          ],
        },
        (err, stats) => {
          const pageThemeContent = getContent("page_theme.php");
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(
            /return t\('Concrete5 Theme'\)/i.test(pageThemeContent),
            "couldn't find matching page theme name"
          ).to.be.true;
          expect(
            /namespace Concrete\\Core\\Package\\CoolPackage\\Theme\\C5Theme;/i.test(
              pageThemeContent
            ),
            "generated incorrect namespace"
          ).to.be.true;
          done(err);
        }
      );
    });
  });
  describe("Setting various options", () => {
    afterEach((done) => {
      rimraf(outputDir, done);
    });

    it("should not generate html files if deleteHtml set", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin({ ...pluginConfig, deleteHtml: true }),
          ],
        },
        (err, stats) => {
          const pageThemeContent = getContent("page_theme.php");
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(
            /return t\('My C5 Theme'\)/i.test(pageThemeContent),
            "couldn't find matching page theme name"
          ).to.be.true;
          expect(() => {
            readFileSync(join(outputDir, "index.html"));
          }, "file was found").to.throw();

          done(err);
        }
      );
    });

    it("should not generate any files if skipIndex is set", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin({ ...pluginConfig, skipIndex: true }),
          ],
        },
        (err, stats) => {
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(() => {
            readFileSync(join(outputDir, "page_theme.php"));
          }, "file was found").to.throw();

          done(err);
        }
      );
    });

    it("should not generate default.php if its defaultPage is not found", (done) => {
      webpack(
        {
          ...webpackConfig,
          plugins: [
            new HtmlWebpackPlugin(HtmlWebpackPluginOptions),
            //@ts-ignore
            new HtmlWebpackC5ThemePlugin({
              ...pluginConfig,
              defaultPage: "index22.html",
            }),
          ],
        },
        (err, stats) => {
          const pageThemeContent = getContent("page_theme.php");
          expect(!!err, "Webpack has an error").to.be.false;
          expect(stats?.hasErrors(), "The plugin has an error").to.be.false;
          expect(
            /return t\('My C5 Theme'\)/i.test(pageThemeContent),
            "couldn't find matching page theme name"
          ).to.be.true;
          expect(() => {
            readFileSync(join(outputDir, "default.php"));
          }, "file was found").to.throw();

          done(err);
        }
      );
    });
  });
});
