/* globals $, utils */
'use strict';

function getRoot () {
  return typeof InstallTrigger !== 'undefined' ? 'root________' : '0';
}

var tree = $('#tree');
tree.jstree({
  'types': {
    'file': {
      'icon': 'item',
      'max_children': 0
    },
    'folder': {
      'icon': 'folder'
    }
  },
  'plugins' : [
    'state',
    'dnd',
    'types',
    'contextmenu'
  ],
  'core' : {
    'check_callback' : true,
    'multiple': false,
    'data' : function (obj, cb) {
      chrome.bookmarks.getChildren(obj.id === '#' ? getRoot() : obj.id, nodes => {
        cb.call(this, nodes.map(node => {
          let children = !node.url;
          return {
            text: node.title,
            id: node.id,
            type: children ? 'folder' : 'file',
            icon: children ? null : 'chrome://favicon/' + node.url,
            children,
            data: {
              dateGroupModified: node.dateGroupModified,
              dateAdded: node.dateAdded,
              url: node.url || ''
            }
          };
        }));
      });
    }
  },
  'contextmenu': {
    'items': (node) => {
      return {
        'Copy Title': {
          'label': 'Copy Title',
          'action': () => utils.copy(node.text)
        },
        'Copy Link': {
          'label': 'Copy Link',
          'action': () => utils.copy(node.data.url),
          '_disabled': () => !node.data.url
        },
        'Rename Title': {
          'separator_before': true,
          'label': 'Rename Title',
          'action': () => window.dispatchEvent(new Event('properties:select-title'))
        },
        'Edit Link': {
          'label': 'Edit Link',
          'action': () => window.dispatchEvent(new Event('properties:select-link')),
          '_disabled': () => !node.data.url
        },
      };
    }
  }
});

tree.on('dblclick.jstree', () => {
  let ids = tree.jstree('get_selected');
  let node = tree.jstree('get_node', ids[0]);
  if (node && node.data && node.data.url) {
    chrome.runtime.sendMessage({
      cmd: 'open',
      url: node.data.url
    });
  }
});

tree.on('move_node.jstree', (e, data) => {
  chrome.bookmarks.move(data.node.id, {
    parentId: data.parent,
    index: data.position + (data.old_position >= data.position ? 0 : 1)
  });
});

window.addEventListener('tree:open-array', e => {
  let arr = e.detail.nodes;
  tree.jstree('deselect_all');
  tree.jstree('close_all');
  tree.jstree('close_all', () => {
    tree.jstree('load_node', arr.reverse(), () => {
      let id = arr[0];
      tree.jstree('select_node', id);
      $('#' + id + '_anchor').focus();
    });
  });
});
