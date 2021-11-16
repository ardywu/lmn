/**
 * MIT License
 * 
 * Copyright (c) 2021 Ardy Wu
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 */

'use strict';

const lmn = (() => {
  /**
   * Convert a template string into HTML DOM nodes
   * @param  {String} str         The template string
   * @return {HTMLCollection}     The template HTML
   */
  const html = (str) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(str, 'text/html');
    return doc.body.firstChild;
  };

  /**
   * Render HTML DOM nodes
   * @param  {String} where  data-id attribute
   * @param  {Node} what     The nodes
   * @return {Node}          The place holder
   */
  const render = (where, what) => {
    const node = typeof what === 'function' ? what() : what;
    const place = document.querySelector(`[data-id="${where}"`);
    if (place) place.innerHTML = node;
    return place;
  };

  const state = () => {
    const vireo = a => b => f => f(a)(b);

    const getL  = p => p(l => _ => l);
    const getR  = p => p(_ => r => r);
    const getLR = p => p(l => r => [l, r]);
  
    const setL  = newL => p => vireo(newL)(getR(p));
    const setR  = newR => p => vireo(getL(p))(newR);
  
    const mapL  = transform => p => vireo(transform(getL(p)))(getR(p));
    const mapR  = transform => p => vireo(getL(p))(transform(getR(p)));
  
    const list = new Map();

    const has = key => list.has(key);
    const get = key => (list.has(key) ? getR(list.get(key)) : undefined);
    const set = (key, value) => {
      const a = (list.has(key) ? list.get(key) : undefined);
      const b = (a ? setR(value)(a) : vireo(key)(value));
      list.set(key, b);
    }
    return {has, get, set};
  }
 
  const store = ((state) => () => {
    const states = state();
    const has = states.has;
    const get = states.get;
    const set = (key, value) => {
      states.set(key, value);
      publish(key, value);
    }

    const subscribers = state();
    const subscribe = (key, action) => {
      const a = subscribers.get(key) || [];
      const b = a.concat(action);
      subscribers.set(key, b);
    };
    const unsubscribe = (key, action) => {
      const a = subscribers.get(key) || [];
      const b = a.filter(act => act !== action);
      subscribers.set(key, b);
    };
    const publish = (key, value) => {
      const actions = subscribers.get(key) || [];
      actions.forEach(action => action(value));
    };
    return {has, get, set, subscribe, unsubscribe};
  })(state);
  
  const repository = ((store) => (() => {
    const has = store.has;
    const get = store.get;
    const set = store.set;
    const subscribe = store.subscribe;
    const unsubscribe = store.unsubscribe;
    const save = (key, value, url, init = {}) => {
      fetch(url, init || {
        method: 'POST', // *GET, POST, PUT, DELETE, etc
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
        body: JSON.stringify(value) // body data type must match "Content-Type" header
      }).then(response => response.json())
        .then(data => store.set(key, data[key]));
    };
    const load = (key, url, init = {}) => {
      fetch(url, init || {
        method: 'GET', // *GET, POST, PUT, DELETE, etc.
        mode: 'cors', // no-cors, *cors, same-origin
        cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
        credentials: 'same-origin', // include, *same-origin, omit
        headers: {
          'Content-Type': 'application/json'
          // 'Content-Type': 'application/x-www-form-urlencoded',
        },
        redirect: 'follow', // manual, *follow, error
        referrerPolicy: 'no-referrer' // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
      }).then(response => response.json())
        .then(data => store.set(key, data[key]));
    };
    
    return {has, get, set, subscribe, unsubscribe, load, save};
  }))(store());

  const router = ((state, render) => (container, window) => {
    const routes = state();
    var current = '';

    const add = (url, caption, view) => {
      routes.set(url, view);

      const a = routes.get('nav') || [];
      const b = a.concat({url:url, caption:caption});
      routes.set('nav', b);
    };

    const origin = () => window.location.origin;
    const pathname = () => current;
    const fullpath = () => window.location.origin + '/#' + current;

    const draw = view => render(container || 'app', view);

    const nav = () => routes.get('nav');

    const redraw = () => draw(routes.get(current));
    
    const routeto = url => {
      if (routes.has(url)) {
        current = url;
        window.history.pushState({}, url, fullpath());
        redraw();
      }
    };

    window.onpopstate = () => redraw();

    return {add, nav, origin, pathname, redraw, routeto};
  })(state, render);

  return {html, render, state, store, repository, router};
})();
