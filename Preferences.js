/*
 * This is a part of You2ber
 * Copyright (C) 2021 konkor <konkor.github.io>
 *
 * Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * You should have received a copy of the GNU General Public License along
 * with this program. If not, see <http://www.gnu.org/licenses/>.
 */

imports.gi.versions.Gtk = '3.0';

const Gtk = imports.gi.Gtk;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Lang = imports.lang;

const APPDIR = getCurrentFile ()[1];

const Prefs = imports.prefs;

var Preferences = new Lang.Class ({
  Name: 'Preferences',

  _init: function () {
    this.application = new Gtk.Application ({
      application_id: "org.konkor.you2ber.preferences"
    });
    GLib.set_application_name ("You2ber Preferences");
    GLib.set_prgname ("You2ber Preferences");
    this.application.connect ('activate', this._onActivate.bind (this));
    this.application.connect ('startup', this._onStartup.bind (this));
  },

  _onActivate: function (){
    this._window.present ();
  },

  _onStartup: function () {
    this._window = new Gtk.Window ();
    this._window.window_position = Gtk.WindowPosition.MOUSE;
    this._window.title = "You2ber Preferences";
    if (!this._window.icon) try {
      this._window.icon = Gtk.Image.new_from_file (APPDIR + "/data/icons/u2b.png").pixbuf;
    } catch (e) {
      error (e.message);
    }
    this._window.set_default_size (640, 320);
    Prefs.init ();
    this.w = Prefs.buildPrefsWidget ();
    this._window.add (this.w);
    this.application.add_window (this._window);
    this._window.show_all ();
  }
});

function getCurrentFile () {
  let stack = (new Error()).stack;
  let stackLine = stack.split('\n')[1];
  if (!stackLine)
    throw new Error ('Could not find current file');
  let match = new RegExp ('@(.+):\\d+').exec(stackLine);
  if (!match)
    throw new Error ('Could not find current file');
  let path = match[1];
  let file = Gio.File.new_for_path (path).get_parent();
  return [file.get_path(), file.get_parent().get_path(), file.get_basename()];
}

let app = new Preferences ();
app.application.run (ARGV);
