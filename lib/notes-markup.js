'use babel';

import NotesMarkupView from './notes-markup-view';
import { CompositeDisposable } from 'atom';

export default {

  notesMarkupView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    this.notesMarkupView = new NotesMarkupView(state.notesMarkupViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.notesMarkupView.getElement(),
      visible: false
    });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'notes-markup:toggle': () => this.toggle()
    }));
  },

  deactivate() {
    this.modalPanel.destroy();
    this.subscriptions.dispose();
    this.notesMarkupView.destroy();
  },

  serialize() {
    return {
      notesMarkupViewState: this.notesMarkupView.serialize()
    };
  },

  toggle() {
    console.log('NotesMarkup was toggled!');
    return (
      this.modalPanel.isVisible() ?
      this.modalPanel.hide() :
      this.modalPanel.show()
    );
  }

};
