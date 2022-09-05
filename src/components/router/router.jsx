import * as React from "react";
import { Switch, Route, Router } from "wouter";
import Home from "../../vite/home";
import About from "../../vite/about";

/**
* The router is imported in app.jsx
*
* Our site just has two routes in it–Home and About
* Each one is defined as a component in /pages
* We use Switch to only render one route at a time https://github.com/molefrog/wouter#switch-
*/

// eslint-disable-next-line import/no-anonymous-default-export, react/display-name
export default () => (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
    </Switch>
);
