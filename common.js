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

'use strict';

chrome.runtime.onMessage.addListener(request => {
  if (request.cmd === 'validate') {
    const req = new XMLHttpRequest();
    req.open('GET', request.url);
    req.onload = () => chrome.runtime.sendMessage({
      cmd: 'notify.inline',
      msg: 'Link is fine'
    });
    req.onerror = e => chrome.runtime.sendMessage({
      cmd: 'notify.inline',
      msg: e.type + ' ' + req.status
    });
    req.send();
  }
  else if (request.cmd === 'update-title') {
    const req = new XMLHttpRequest();
    req.open('GET', request.url);
    req.responseType = 'document';
    req.onload = () => {
      const title = req.responseXML.title;
      if (title) {
        chrome.runtime.sendMessage({
          cmd: 'title-info',
          id: request.id,
          title
        });
      }
      else {
        chrome.runtime.sendMessage({
          cmd: 'notify.inline',
          msg: 'Cannot detect "title" from GET response'
        });
      }
    };
    req.onerror = e => chrome.runtime.sendMessage({
      cmd: 'notify.inline',
      msg: e.type + ' ' + req.status
    });
    req.send();
  }
});

function activate(tabId) {
  chrome.browserAction.setIcon({
    tabId,
    path: {
      '16': 'data/icons/bookmarked/16.png',
      '32': 'data/icons/bookmarked/32.png',
      '64': 'data/icons/bookmarked/64.png'
    }
  });
}
function deactivate(tabId) {
  chrome.browserAction.setIcon({
    tabId,
    path: {
      '16': 'data/icons/16.png',
      '32': 'data/icons/32.png',
      '64': 'data/icons/64.png'
    }
  });
}

function search(url, callback) {
  if (url.startsWith('about:') || url.startsWith('view-source:')) {
    return;
  }
  chrome.bookmarks.search({url}, callback);
}

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  search(tab.url, nodes => {
    if (nodes && nodes.length) {
      activate(tabId);
    }
  });
});

function update() {
  chrome.tabs.query({}, tabs => {
    tabs.forEach(tab => {
      search(tab.url, nodes => {
        if (nodes && nodes.length) {
          activate(tab.id);
        }
        else {
          deactivate(tab.id);
        }
      });
    });
  });
}
chrome.bookmarks.onChanged.addListener(update);
chrome.bookmarks.onCreated.addListener(update);
chrome.bookmarks.onRemoved.addListener(update);
update();

// FAQs & Feedback
chrome.storage.local.get({
  'version': null,
  'faqs': navigator.userAgent.indexOf('Firefox') === -1
}, prefs => {
  const version = chrome.runtime.getManifest().version;

  if (prefs.version ? (prefs.faqs && prefs.version !== version) : true) {
    chrome.storage.local.set({version}, () => {
      chrome.tabs.create({
        url: 'http://add0n.com/bookmarks-manager.html?version=' + version +
          '&type=' + (prefs.version ? ('upgrade&p=' + prefs.version) : 'install')
      });
    });
  }
});

{
  const {name, version} = chrome.runtime.getManifest();
  chrome.runtime.setUninstallURL('http://add0n.com/feedback.html?name=' + name + '&version=' + version);
}
