/*******************************************************************************
    Bookmark Manager and Viewer - An elegant bookmark manager with fuzzy search and more

    Copyright (C) 2014-2017 InBasic

    This program is free software: you can redistribute it and/or modify
    it under the terms of the Mozilla Public License as published by
    the Mozilla Foundation, either version 2 of the License, or
    (at your option) any later version.
    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    Mozilla Public License for more details.
    You should have received a copy of the Mozilla Public License
    along with this program.  If not, see {https://www.mozilla.org/en-US/MPL/}.

    Home: http://add0n.com/bookmarks-manager.html
    GitHub: https://github.com/inbasic/bookmarks-manager/
*/

/* globals tree */
'use strict';

var properties = document.querySelector('#properties');
properties.addEventListener('keyup', e => {
  const target = e.target;
  const tr = target.closest('tr');
  if (tr) {
    tr.querySelector('[type=submit]').disabled = !(target && target.dataset.value !== target.value && target.value);
  }
});
properties.addEventListener('submit', e => {
  e.preventDefault();
  e.stopPropagation();

  const form = e.target;
  const tr = properties.querySelector('[form=' + form.id + ']').closest('tr');
  const id = properties.dataset.id;
  const input = tr.querySelector('input');
  const prp = {};
  prp[form.id] = input.value;
  chrome.bookmarks.update(id, prp, () => {
    input.dataset.value = input.value;
    tr.querySelector('[type=submit]').disabled = true;
    // updating search view
    const results = document.querySelector('#results tbody');
    const rtr = results.querySelector(`[data-id="${id}"]`);
    if (rtr) {
      rtr.querySelector('td:nth-child(' + (form.id === 'title' ? 1 : 2) + ')').textContent = input.value;
    }
    // updating tree view
    if (form.id === 'title') {
      tree.jstree('set_text', id, input.value);
    }
    // reseting fuse
    window.dispatchEvent(new Event('search:reset-fuse'));
  });
});

window.addEventListener('properties:select-title', () => {
  const title = properties.querySelector('tr:nth-child(1) input');
  title.focus();
  title.select();
});
window.addEventListener('properties:select-link', () => {
  const url = properties.querySelector('tr:nth-child(2) input');
  url.focus();
  url.select();
});

tree.on('select_node.jstree', (e, data) => {
  properties.dataset.id = data.node.id;

  const title = properties.querySelector('tr:nth-child(1) input');
  title.dataset.value = title.value = data.node.text;
  title.dispatchEvent(new Event('keyup', {
    bubbles: true
  }));
  const url = properties.querySelector('tr:nth-child(2) input');
  url.disabled = data.node.type === 'folder';
  url.dataset.value = url.value = data.node.data.url;
  url.dispatchEvent(new Event('keyup', {
    bubbles: true
  }));

  const d = new Date(data.node.data.dateAdded);
  properties.querySelector('tr:nth-child(3) span').textContent = d.toDateString() + ' ' + d.toLocaleTimeString();
});
