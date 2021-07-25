# Consumer-to-Consumer E-Commerce Webapp

###### [Demo | Status: Live](http://143.198.57.139:8008/)

_School Assignment for web development class_

- Node, Express, Mongoose, TypeScript
- Makeshift vanilla js templating engine
- Makeshift CSS framework, algorithmic sizing and typescale
- Demo of DB API methods on api page.

###### Templating engine extended by classes for differenet types of page templates.

```javascript
// Example

class DashboardPage {
  constructor(mainTitle, controlsTitle, templateOptions) {
    document.title = mainTitle;
    this.page = new TemplateEngine(controlsTitle, templateOptions);
    this.page.css.update("./css/dashboard.css");
    this.page.layout.useNavbar();
    this.page.layout.useFooter();
    this.page.css.updateGrid({gridTemplateRows: "min-content"})
  }
```

Import, construct, add nodes and hooks. . .

```JavaScript
function renderHomePage() {
  const dashboard = new DashboardPage("Home | Ostaa", "Shop | Sell");
  dashboard.addLeft([
    dashboard.page.constructNode({tag: "caption", inner: document.title})
    dashboard.page.component.searchField("search-items"),
    dashboard.page.component.searchField("home listings"),
    dashboard.page.component.searchField("home purchases"),
    dashboard.page.component.listingForm("Post a Listing", "SELL"),
    dashboard.page.component.maskedText({
        tag: "h3",
        inner: sessionStorage.getItem("username")
        })
    dashboard.page.component.accordion({id: "accordion-right"})
  ])
  dashboard.page.css.addAnimation(document.querySelectorAll("button"), "vibrate")
}
```

###### 1. responsive sizing. user accounts and history.

![demo 1](demo/demo1.gif)

######

###### 2. image uploads to DB

![demo 2](demo/demo2.gif)

###### 3. user accounts, ecommerce api

![demo 3](demo/demo3.gif)

```bash
touch server-logs.txt; nohup >> server-logs.txt npm run start-ts . & disown;
```

```bash
lsof -nP -iTCP -sTCP:LISTEN
```
