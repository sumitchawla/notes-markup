'use babel';
'use date';

import NotesMarkupView from './notes-markup-view';
import NotesActiveEditorInfoView from './notes-active-editor-info';

import { CompositeDisposable } from 'atom';

import {get_date_string, get_date_string_ex, test_fn} from './helpers'

export default {

  notesMarkupView: null,
  modalPanel: null,
  subscriptions: null,

  activate(state) {
    console.log('NotesMarkup activate: ' + get_date_string(1));
    this.notesMarkupView = new NotesMarkupView(state.notesMarkupViewState);
    this.modalPanel = atom.workspace.addModalPanel({
      item: this.notesMarkupView.getElement(),
      visible: false
    });

    // Add an opener for our view.
    // atom.workspace.addOpener(uri => {
    //   if (uri === 'atom://notes-active-editor-info') {
    //     return new NotesActiveEditorInfoView();
    //   }
    // });

    // Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
    this.subscriptions = new CompositeDisposable();

    // Register command that toggles this view
    this.subscriptions.add(atom.commands.add('atom-workspace', {
      'notes-markup:handle_shortcut': (event) => this.handle_shortcut(event)
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

  txt_with_position(text,prefix_endline, suffix_endline, event) {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      if (prefix_endline) {
        editor.insertNewlineBelow();
      }
      editor.insertText(text);
      if (suffix_endline) {
        editor.insertNewlineBelow();
      }
    }
  },

  append_text (text, event) {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      pos = editor.getCursorScreenPosition();
      txt = editor.lineTextForScreenRow(pos.row);
      var new_text = txt + " " + text;
      editor.moveToBeginningOfScreenLine();
      editor.cutToEndOfLine();
      editor.insertText(new_text);
    }
  },

  extend_task_at_position(add_days, event){
    console.log("extend_task_at_position");
    // atom.workspace.toggle('atom://notes-active-editor-info');
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      pos = editor.getCursorScreenPosition();
      console.log(pos);
      txt = editor.lineTextForScreenRow(pos.row);
      console.log(txt);
      var match = txt.match(/(.*)\(Sumit DUE (\d{1,2}\/\d{1,2}\/\d{4})\)/);
      if (match == null){
       var match = txt.match(/(.*)\(DUE (\d{1,2}\/\d{1,2}\/\d{4})\)/);
      }
      if (match == null){
       log("No regex match found for due item");
      }
      var d = match[2];
      var result =  new Date(d);
      result.setDate(result.getDate() + add_days);
      var new_text = txt.replace(d, "" + get_date_string_ex(result));
      editor.moveToBeginningOfScreenLine();
      editor.cutToEndOfLine();
      editor.insertText(new_text);
    }
  },

  handle_shortcut(event) {
    console.log('NotesMarkup handle_shortcut');
    txt_with_position = this.txt_with_position
    extend_task_at_position = this.extend_task_at_position
    append_text = this.append_text
    keyboardEvent = event.originalEvent
    key = keyboardEvent.key
    code = keyboardEvent.code
    console.log(event)
    if (keyboardEvent.altKey == true) {
      switch (code) {
        case "Digit1":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(1) + ")",false, false, event);
        case "Digit2":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(2) + ")",false, false, event);
        case "Digit3":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(3) + ")",false, false, event);
        case "Digit4":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(7) + ")",false, false, event);
        case "Digit5":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(15) + ")",false, false, event);
        case "Digit6":
         return txt_with_position("\t* (Sumit DUE "+ get_date_string(30) + ")",false, false, event);
       }
    } else if (keyboardEvent.metaKey == true) {
      switch (code) {
        case "Digit1":
          return extend_task_at_position(1, event);
        case "Digit2":
          return extend_task_at_position(2, event);
        case "Digit3":
          return extend_task_at_position(3, event);
        case "Digit4":
          return extend_task_at_position(7, event);
        case "Digit5":
          return extend_task_at_position(15, event);
        case "Digit6":
          return extend_task_at_position(30, event);
      }
    }
    else {
      console.log(code);
      switch (code) {
        case "KeyZ":
            txt_with_position(get_date_string(0) + "\nAttendees:\nCC:\n\nMeeting Notes: (Sumit DUE "+ get_date_string(1) + ")" + "\nDiscussed:\n\nAction Items:\n\n\n\n",true, true, event);
            return;
         case "KeyN":
          return txt_with_position("\t\t-[" +  get_date_string(0) + "]",true, false, event);
         case "KeyX":
          return append_text("[Done-" +  get_date_string(0) + "]",false, false, event);
         case "Digit1":
          return txt_with_position("\t* (DUE "+ get_date_string(1) + ")",false, false, event);
         case "Digit2":
          return txt_with_position("\t* (DUE "+ get_date_string(2) + ")",false, false, event);
         case "Digit3":
          return txt_with_position("\t* (DUE "+ get_date_string(3) + ")",false, false, event);
         case "Digit4":
          return txt_with_position("\t* (DUE "+ get_date_string(7) + ")",false, false, event);
         case "Digit5":
          return txt_with_position("\t* (DUE "+ get_date_string(15) + ")",false, false, event);
         case "Digit6":
          return txt_with_position("\t* (DUE "+ get_date_string(30) + ")",false, false, event);
      }
    }
  }
};
