# html-webpack-c5-theme-plugin

## Installation

To install first run

```
npm --save-dev install html-webpack-c5-plugin html-webpack-plugin webpack
```

or alternatively use the tailwind-example-repo

## Defining an area

To define a concrete 5 area in your files
just put the following html tag

```
<c5-area name="C5 area"></c5-area>
```

### Make an area global

```
<c5-area name="C5 area" global="true"></c5-area>
```

### Disable Editing Controls

```
<c5-area name="C5 area" editable="false"></c5-area>
```

## Defining an element

To define an element area just use html5 comment tags like this replace `Element Name` with what you want the element to be called

```
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

```
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

```
...
<div class="container">
    <?php $view->include('elements/element_name');?>
</div>
...
```
