# Html-Webpack-C5-Theme-Plugin

![Tests](https://github.com/deek87/html-webpack-c5-theme-plugin/workflows/Tests/badge.svg?branch=master) ![Build](https://github.com/deek87/html-webpack-c5-theme-plugin/workflows/Build/badge.svg?branch=master)

## Installation

To install first run

```
npm install -D html-webpack-plugin webpack
npm install -D html-webpack-c5-theme-plugin
```

then inside your webpack.config.js file

```js
const { HtmlWebpackC5ThemePlugin } = require("html-webpack-c5-theme-plugin");
// or use const HtmlWebpackC5ThemePlugin = require("html-webpack-c5-theme-plugin").default;
const HtmlWebpackPlugin = require("html-webpack-plugin");
module.exports ={
    ...
    plugins : [
        new HtmlWebpackPlugin(),
        new HtmlWebpackC5ThemePlugin(pluginOptions, HtmlWebpackPlugin)
    ]
    ...
}
```

`pluginOptions` can be either a string representing a theme name or a configuration object
`HtmlWebpackPlugin` does not need to be passed but sometimes when dealing with multiple installations of the html-webpack-plugin, assets may not be correctly passed

## Configuration

Configuration options for this plugin are as follows

```js
const c5Options = {
  packageHandle: null, // set to null unless you want to add theme to a package.
  themeHandle: "c5_theme", // The theme handle of the theme. This will be used in page_theme.php for namespacing.
  themeName: "Concrete5 Theme", // The theme name of the outputted files. This will be will be used in page_theme.php.
  themeDescription: "A nice description", // Enter a description about the theme. This will be used in page_theme.php.
  skipIndex: false, // Set to true if you dont want to process index.html as a php file. Useful if your index.html is just links.
  defaultPage: "index.html", // This is the page that will be used for generating default.php.
  deleteHtml: false, // This will delete html files after generating php.
};
```

## Defining an area

To define a concrete 5 area in your files
just put the following html tag

```html
<c5-area name="C5 area"></c5-area>
```

### Make an area global

```html
<c5-area name="C5 area" global="true"></c5-area>
```

### Disable Editing Controls

```html
<c5-area name="C5 area" editable="false"></c5-area>
```

## Defining an element

To define an element area just use html5 comment tags like this replace `Element Name` with what you want the element to be called

```html
<div class="container">
  <!--C5 Begin Element Name-->
  <div class="sm-12 md-10">
    <c5-area name="Main"></c5-area>
  </div>
  <!--C5 End Element Name-->
</div>
```

This will be placed into a file under 'theme_name/elements/element_name.php'

The element file would contain the following

```php
<?php
defined('C5_EXECUTE') or die('Access Denied.');
/* @var \Concrete\View\View $view */
$c = \Concrete\Core\Page\Page::getCurrentPage();?>
<div class="sm-12 md-10">
        <?php
        $area = new \Concrete\Area\Area('Main');
        $area->display($c);
        ?>
    </div>
```

The main html file will be outputted like this

```php
...
<div class="container">
    <?php $view->include('elements/element_name');?>
</div>
...
```
