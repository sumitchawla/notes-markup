'use babel';
'use date';
var shell = require("electron").shell;

var RTF = require('./rtf');
var copy = require('copy-paste');

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
      'notes-markup:handle_shortcut': (event) => this.handle_shortcut(event),
      'notes-markup:copy_text': (event) => this.copy_text(event)
    }));

    atom.workspace.activePaneContainer.paneContainer.element.addEventListener("click", function(e) {
            var editor = atom.workspace.getActiveTextEditor();

            if(!editor) {
                return;
            }

            if (e.ctrlKey || e.metaKey) {
              var pos = editor.getCursorScreenPosition();
              var txt = editor.lineTextForScreenRow(pos.row);
              var match = txt.match(/(https?:\/\/)([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.\-~\+\#]*)*\/?/);
              if (match == null) {
                return;
              }
              var link = decodeURI(match[0]);
              console.log("Opening " + link + " in browser!");
              shell.openExternal(link);
            }

    });
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
      editor.deleteToEndOfLine();
      editor.insertText(new_text);
      editor.moveToBeginningOfScreenLine();
    }
  },
  get_action_item(txt) {
      var match = txt.match(/(.*)(\(Sumit DUE (\d{1,2}\/\d{1,2}\/\d{4})\))/);
      var actor = null;
      if (match == null){
         match = txt.match(/(.*)(\(DUE (\d{1,2}\/\d{1,2}\/\d{4})\))/);
      } else {
          actor = "Sumit";
      }
      if (match == null){
       //console.log("No regex match found for due item in text : %s" % txt);
       return {
           success: false
       };
     }
     var action_item_text = match[1];
     var action_date_text = match[2];
     var action_date = match[3];
     if (actor == null) {
        actor_match = action_item_text.match(/\@([^\s]+)/);
        if (actor_match != null) {
            actor = actor_match[1];
            }
     }

     if (actor != null) {
       action_item_text = action_item_text.replace(actor, "");
       action_item_text = action_item_text.replace("*", "");
       action_item_text = action_item_text.replace("@", "");
       action_item_text = action_item_text.trim();
     }

     var is_done_match = txt.match(/(\[Done-\d{1,2}\/\d{1,2}\/\d{4}\])/);
     var is_done = false;
     if (is_done_match != null) {
       is_done = true;
       action_date_text += " " + is_done_match[1];
     }
     return {
         success: true,
         is_done : is_done,
         actor : actor,
         action_item_text: action_item_text,
         action_date_text : action_date_text,
         action_date : new Date(action_date)
     }
  },
  extend_task_at_position(that, add_days, event){
    // atom.workspace.toggle('atom://notes-active-editor-info');
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      pos = editor.getCursorScreenPosition();
      //console.log(pos);
      txt = editor.lineTextForScreenRow(pos.row);
      //console.log(txt);
      var action_item = that.get_action_item(txt);
      if (!action_item.success){
       console.log("No regex match found for due item in text : %s" % txt);
       return;
      }
      var result =  action_item.action_date;
      var current_string = get_date_string_ex(action_item.action_date);
      result.setDate(result.getDate() + add_days);
      //console.log("extend_task_at_position %s extended to %s - %s days - %d", action_item.action_date, result, get_date_string_ex(result), add_days);
      var new_text = txt.replace(current_string, "" + get_date_string_ex(result));
      //console.log(current_string, new_text);
      editor.moveToBeginningOfScreenLine();
      editor.deleteToEndOfLine();
      editor.insertText(new_text);
      editor.moveToBeginningOfScreenLine();
    }
  },
  copy_text(event) {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      const el = atom.workspace.viewRegistry.getView( editor );
      console.log("inside copy_text");
      pos = editor.getCursorScreenPosition();
      row = pos.row
      var content = ""
      var txt = editor.lineTextForScreenRow(row);
      var match = txt.match(/MEETING_NOTES_START/);

      while (match == null){
        content = txt + "\n" + content;
        row = row - 1;
        txt = editor.lineTextForScreenRow(row)
        match = txt.match(/MEETING_NOTES_START/);
      }
      var start = row;
      row = pos.row + 1
      txt = editor.lineTextForScreenRow(row);
      match = txt.match(/MEETING_NOTES_END/);
      while (match == null){
        content = content + txt + "\n";
        row = row + 1;
        txt = editor.lineTextForScreenRow(row)
        match = txt.match(/MEETING_NOTES_END/);
      }
      var end = row - 1;
      //console.log(content);
      var total_lines = end - start;
      var rtf = RTF('Calibri');
      lines = content.split("\n")
      var color_map = {
        "black" : "rgb(0, 0, 0)",
        "red" : "rgb(205, 142, 00)",
        "grey" : "rgb(171, 178, 191)"
      }
      action_items_by_actor = {};
      //Pre Parse Action Items:
      for (idx in lines) {
        line = lines[idx];
        action_item = this.get_action_item(line);
        if (action_item.success && action_item.actor) {
          if (action_item.action_item_text.indexOf("Meeting Notes") > -1) continue;
          var actors = action_item.actor.split("/");
          for (actor_idx in actors) {
            var actor = actors[actor_idx];
            if (!(actor in action_items_by_actor)) {
              action_items_by_actor[actor] = [];
            }
            action_items_by_actor[actor].push(action_item);
          }
        }
      }
      function skip_heading_for_tokens(txt) {
        var tokens  = ["https", "http"];
        for (i in tokens) {
          var token = tokens[i];
          if (txt.indexOf(token) >= 0) return true;
        }
        return false;
      }
      for (idx in lines) {
        line = lines[idx]
        //console.log("Here" + line);
        var match = line.match(/^([^\:]*)\:(.*)$/);
        var skip_empty_values = { "Attendees": true, "CC": true};
        if (match != null && !(skip_heading_for_tokens(match[1]))) {
            var heading_non_trimmed = match[1];
            var value_non_trimmed = match[2];
            var heading = match[1].trim();
            var value = match[2].trim();
            if (heading == "Meeting Notes") continue;
            if (heading == "Discussed")  {
              rtf.append("\nAction Items:\n",color_map["black"], {
                bold: true,
                underline: false,
                italic: false,
              });
              for (actor_key in action_items_by_actor) {
                  action_items_for_actor = action_items_by_actor[actor_key]
                  rtf.append('\n');
                  rtf.append("\t" + actor_key + ":",color_map["black"], {
                    bold: true,
                    underline: false,
                    italic: false,
                  });
                  for (idx in action_items_for_actor) {
                    rtf.append('\n');
                    action_item = action_items_for_actor[idx];
                    rtf.append("\t     * ", color_map["black"], {
                      bold: false,
                      underline: false,
                      italic: false,
                    });
                    rtf.append(action_item.action_item_text, color_map["black"], {
                      bold: false,
                      underline: false,
                      italic: false,
                    });
                    if (action_item.is_done) {
                      rtf.append(action_item.action_date_text, color_map["grey"], {
                        bold: false,
                        underline: false,
                        italic: true,
                      });
                    } else {
                      rtf.append(" (DUE " + get_date_string_ex( action_item.action_date) + ")", color_map["red"], {
                        bold: true,
                        underline: true,
                        italic: true,
                      });
                    }
                  }
                }
                rtf.append('\n\n');
            }

            if (heading in skip_empty_values && value.length == 0) continue;
            rtf.append(heading_non_trimmed + ":", color_map["black"], {
              bold: true,
              underline: false,
              italic: false,
            });
            rtf.append(value_non_trimmed, color_map["black"], {
              bold: false,
              underline: false,
              italic: false,
            });
        } else {
          action_item = this.get_action_item(line);
          if (action_item.success && action_item.actor) {
            rtf.append("\t* ", color_map["black"], {
              bold: false,
              underline: false,
              italic: true,
            });

            rtf.append(action_item.actor + " - ", color_map["black"], {
              bold: true,
              underline: false,
              italic: true,
            });

            rtf.append(action_item.action_item_text, color_map["black"], {
              bold: false,
              underline: false,
              italic: true,
            });
            rtf.append(" (DUE " + get_date_string_ex( action_item.action_date) + ")", color_map["grey"], {
              bold: false,
              underline: false,
              italic: true,
            });
            // if (action_item.is_done) {
            //   rtf.append(action_item.action_date_text, color_map["grey"], {
            //     bold: false,
            //     underline: false,
            //     italic: true,
            //   });
            // } else {
            //   rtf.append(action_item.action_date_text, color_map["red"], {
            //     bold: true,
            //     underline: true,
            //     italic: true,
            //   });
            // }
          } else {
            rtf.append(line,color_map["black"], {
              bold: false,
              underline: false,
              italic: false,
            });
          }
        }
        rtf.append('\n');
      }
      var rtf_text = rtf.finalize();
      //console.log(rtf_text);
      copy.copy(rtf_text);
    }
  },
  get_context_from_last_meeting(event) {
    const editor = atom.workspace.getActiveTextEditor();
    if (editor) {
      const el = atom.workspace.viewRegistry.getView( editor );
      console.log("get_context_from_last_meeting");
      pos = editor.getCursorScreenPosition();
      row = pos.row
      var content = ""
      var txt = editor.lineTextForScreenRow(row);
      var match = txt.match(/MEETING_NOTES_START/);

      while (match == null){
        row = row + 1; // Look After this only
        txt = editor.lineTextForScreenRow(row)
        match = txt.match(/MEETING_NOTES_START/);
      }
      var start = row;
      txt = editor.lineTextForScreenRow(row);
      match = txt.match(/MEETING_NOTES_END/);
      while (match == null){
        content = content + txt + "\n";
        row = row + 1;
        txt = editor.lineTextForScreenRow(row)
        match = txt.match(/MEETING_NOTES_END/);
      }
      var end = row - 1;
      //console.log(content);
      var total_lines = end - start;
      lines = content.split("\n")
      //Pre Parse Action Items:
      var title = null;
      var action_items_text = "";
      for (idx in lines) {
        line = lines[idx];
        if (title == null) {
          var match = line.match(/^([0-9/]*)\:(.*)$/);
          if (match != null) {
            title = match[2];
          }
        } else {
          action_item = this.get_action_item(line);
          if (action_item.success) {
            var skip_action_item = false;
            if (action_item.action_item_text.indexOf("Meeting Notes") == 0) {
              skip_action_item = true;
            }
            if (action_item.is_done) {
              skip_action_item = true;
            }
            // console.log(line + "   " + skip_action_item);
            if (!skip_action_item) {
              action_items_text += "\n" + line;
            }
          }
        }
      }
      return {
          title: title,
          action_item_text: action_items_text,
      }
    }
  },
  handle_shortcut(event) {
    console.log('NotesMarkup handle_shortcut');
    txt_with_position = this.txt_with_position
    extend_task_at_position = this.extend_task_at_position
    that = this;
    append_text = this.append_text
    keyboardEvent = event.originalEvent
    key = keyboardEvent.key
    code = keyboardEvent.code
    console.log(event)
    // Option Key
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
    } else if (keyboardEvent.metaKey == true) { // Command Key
      switch (code) {
        case "Digit1":
          return extend_task_at_position(that,1, event);
        case "Digit2":
          return extend_task_at_position(that,2, event);
        case "Digit3":
          return extend_task_at_position(that,3, event);
        case "Digit4":
          return extend_task_at_position(that,7, event);
        case "Digit5":
          return extend_task_at_position(that,15, event);
        case "Digit6":
          return extend_task_at_position(that,30, event);
      }
    }
    else {
      switch (code) {
        case "KeyZ":
          if (keyboardEvent.shiftKey == true) { // Command Key
            var last_meeting_context = this.get_context_from_last_meeting();
            txt_with_position("MEETING_NOTES_START\n\n" + get_date_string(0) + ":" + last_meeting_context.title + "\n\nAttendees:\nCC:\n\nMeeting Notes: (Sumit DUE "+ get_date_string(1) + ")" + "\nDiscussed:\n\n\nPrevious Action items:\n" + last_meeting_context.action_item_text +"\nMEETING_NOTES_END",true, true, event);
          } else  {
            txt_with_position("MEETING_NOTES_START\n\n" + get_date_string(0) + ":<TITLE>\n\nAttendees:\nCC:\n\nMeeting Notes: (Sumit DUE "+ get_date_string(1) + ")" + "\nDiscussed:\n\n\n\nMEETING_NOTES_END",true, true, event);
          }
          return;
         case "KeyN":
          var note_prefix = "\t\t-[" +  get_date_string(0) + "] ";
          return txt_with_position(note_prefix,true, false, event);
         case "KeyX":
          var clipboard_text = atom.clipboard.read();
          var is_valid_clipboard_text = clipboard_text != null
                                      && clipboard_text.length >= 0
                                      && (
                                          clipboard_text.indexOf("https://quip-amazon.com") == 0
                                          || clipboard_text.indexOf("https://wiki.labcollab.net")
                                          || clipboard_text.indexOf("https://issues.labcollab.net")
                                          || clipboard_text.indexOf("https://w.amazon")
                                          || clipboard_text.indexOf("quip-amazon.com") == 0
                                          || clipboard_text.indexOf("wiki.labcollab.net")
                                          || clipboard_text.indexOf("issues.labcollab.net")
                                          || clipboard_text.indexOf("w.amazon")
                                      );
          if (is_valid_clipboard_text) {
            return append_text("[Done-" +  get_date_string(0) + "] (" + clipboard_text + ")",false, false, event);
          }
          return append_text("[Done-" +  get_date_string(0) + "]",false, false, event);
         case "Digit1":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(1) + ")",false, false, event);
         case "Digit2":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(2) + ")",false, false, event);
         case "Digit3":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(3) + ")",false, false, event);
         case "Digit4":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(7) + ")",false, false, event);
         case "Digit5":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(15) + ")",false, false, event);
         case "Digit6":
          return txt_with_position("\t* @ - (DUE "+ get_date_string(30) + ")",false, false, event);
      }
    }
  }
};
