/*
 * you2ber - Simple Frontend For youtube-dl package
 *
 * Copyright (C) 2018 Kostiantyn Korienkov <kapa76@gmail.com>
 *
 * This file is part of you2ber Gnome shell extension.
 *
 * you2ber is free software: you can redistribute it and/or modify it
 * under the terms of the GNU General Public License as published by the
 * Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * you2ber is distributed in the hope that it will be useful, but
 * WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
 * See the GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along
 * with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

const Lang = imports.lang;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;

const Gettext = imports.gettext.domain ('gnome-shell-extensions-you2ber');
const _ = Gettext.gettext;

const EXTENSIONDIR = getCurrentFile ()[1];
imports.searchPath.unshift (EXTENSIONDIR);
const Convenience = imports.convenience;

const DEBUG_KEY = 'debug';
let DEBUG = false;
const AUDIO_KEY = 'audio-folder';
let AUDIODIR = "";
const VIDEO_KEY = 'video-folder';
let VIDEODIR = "";
const PLAYLISTS_KEY = 'playlists';
let PLAYLISTS = false;

var U2PreferencesWidget = new Lang.Class({
    Name: 'U2PreferencesWidget',

    _init: function (params) {
        this.parent (0.0, "you2ber preferences widget", false);

        this.settings = Convenience.getSettings ();
        DEBUG = this.settings.get_boolean (DEBUG_KEY);
        AUDIODIR = this.settings.get_string (AUDIO_KEY);
        if (!AUDIODIR) AUDIODIR = Convenience.get_special_dir (GLib.UserDirectory.DIRECTORY_MUSIC);
        VIDEODIR = this.settings.get_string (VIDEO_KEY);
        if (!VIDEODIR) VIDEODIR = Convenience.get_special_dir (GLib.UserDirectory.DIRECTORY_VIDEOS);
        PLAYLISTS = this.settings.get_boolean (PLAYLISTS_KEY);

        let label = null;
        this.notebook = new Gtk.Notebook ({expand:true});

        this.general = new PageGeneral (this.settings);
        this.notebook.add (this.general);
        label = new Gtk.Label ({label: _("General")});
        this.notebook.set_tab_label (this.general, label);

        this.audio = new PageAudio (this.settings);
        this.notebook.add (this.audio);
        label = new Gtk.Label ({label: _("Audio")});
        this.notebook.set_tab_label (this.audio, label);

        this.video = new PageVideo (this.settings);
        this.notebook.add (this.video);
        label = new Gtk.Label ({label: _("Video")});
        this.notebook.set_tab_label (this.video, label);

        this.notebook.show_all ();
    }
});


var PageGeneral = new Lang.Class({
    Name: 'PageGeneral',
    Extends: Gtk.Box,

    _init: function (settings) {
        let label;
        this.parent ({orientation:Gtk.Orientation.VERTICAL, margin:6});
        this.settings = settings;
        this.border_width = 6;

        label = new Gtk.Label ({label:
            _("<b>Behaviour</b>"),use_markup:true,xalign:0,margin_top:12});
        this.add (label);
        this.cb_playlists = Gtk.CheckButton.new_with_label (_("Download whole playlists"));
        this.cb_playlists.tooltip_text = _("Download playlists if links refer to it.");
        this.cb_playlists.margin = 6;
        this.add (this.cb_playlists);
        this.cb_playlists.active = PLAYLISTS;
        this.cb_playlists.connect ('toggled', Lang.bind (this, (o)=>{
            PLAYLISTS = o.active;
            this.settings.set_boolean (PLAYLISTS_KEY, PLAYLISTS);
        }));

        this.show_all ();
    }
});

var PageAudio = new Lang.Class({
    Name: 'PageAudio',
    Extends: Gtk.Box,

    _init: function (settings) {
        this.settings = settings;
        this.parent ({orientation:Gtk.Orientation.VERTICAL, margin:6});
        this.border_width = 6;

        this.add (new Gtk.Label ({label: _("<b>Audio Folder</b>"), use_markup:true, xalign:0, margin_top:12}));
        this.chooser = new Gtk.FileChooserButton ({title: _("Select folder"),
                           action: Gtk.FileChooserAction.SELECT_FOLDER});
        this.chooser.set_current_folder (AUDIODIR);
        this.chooser.tooltip_text = AUDIODIR;
        this.pack_start (this.chooser, false, true, 0);
        this.chooser.connect ('file_set', Lang.bind (this, ()=>{
            AUDIODIR = this.chooser.get_filename ();
            this.chooser.tooltip_text = AUDIODIR;
            this.settings.set_string (AUDIO_KEY, AUDIODIR);
        }));

        this.show_all ();
    }
});

var PageVideo = new Lang.Class({
    Name: 'PageVideo',
    Extends: Gtk.Box,

    _init: function (settings) {
        this.settings = settings;
        this.parent ({orientation:Gtk.Orientation.VERTICAL, margin:6});
        this.border_width = 6;

        this.add (new Gtk.Label ({label: _("<b>Video Folder</b>"), use_markup:true, xalign:0, margin_top:12}));
        this.chooser = new Gtk.FileChooserButton ({title: _("Select folder"),
                           action: Gtk.FileChooserAction.SELECT_FOLDER});
        this.chooser.set_current_folder (VIDEODIR);
        this.chooser.tooltip_text = VIDEODIR;
        this.pack_start (this.chooser, false, true, 0);
        this.chooser.connect ('file_set', Lang.bind (this, ()=>{
            VIDEODIR = this.chooser.get_filename ();
            this.chooser.tooltip_text = VIDEODIR;
            this.settings.set_string (VIDEO_KEY, VIDEODIR);
        }));

        this.show_all ();
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
    let file = Gio.File.new_for_path (path);
    return [file.get_path(), file.get_parent().get_path(), file.get_basename()];
}

function debug (msg) {
    if (DEBUG) Convenience.debug (msg);
}

function error (msg) {
    Convenience.error (msg);
}

function init() {
    Convenience.initTranslations ();
}

function buildPrefsWidget() {
    let widget = new U2PreferencesWidget ();
    return widget.notebook;
}
