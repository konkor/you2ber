const Lang = imports.lang;
const St = imports.gi.St;
const Clipboard = St.Clipboard.get_default();
const CLIPBOARD_TYPE = St.ClipboardType.CLIPBOARD;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const MessageTray = imports.ui.messageTray;
const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const Soup = imports.gi.Soup;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension ();
const Convenience = Me.imports.convenience;

const EXTENSIONDIR = Me.dir.get_path ();

const DEBUG_KEY = 'debug';
let DEBUG = false;
const AUDIO_KEY = 'audio-folder';
let AUDIODIR = "";
const VIDEO_KEY = 'video-folder';
let VIDEODIR = "";

const WATCH_TIMEOUT = 1000;

let clipboard_watcher = 0;
let installID = 0;
let installed = false;
let udl = null;
let last_text = "";
let uris = [];

const U2Indicator = new Lang.Class({
    Name: "U2Indicator",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent (0.0, "Gnome Youtube Downloader", false);

        this.settings = Convenience.getSettings();
        this.get_settings ();

        check_install_udl ();
        this._icon_on = new St.Icon ({
            gicon:Gio.icon_new_for_string (EXTENSIONDIR + "/data/icons/u2b.svg")
        });
        this.status = new St.Icon ({style: 'icon-size: 20px'});
        this.status.gicon = this._icon_on.gicon;
        let _box = new St.BoxLayout();
        _box.add_actor(this.status);
        this.actor.add_actor (_box);
        this.actor.connect('button-press-event', Lang.bind(this, function () {
            if (!this.menu.isOpen) return;
            if (!installed) check_install_udl ();
            if (this.install) this.install.actor.visible = !installed;
            this.get_settings ();
            this.get_clipboard ();
        }));

        this.build_menu ();
        //this.add_watcher ();
    },

    get_settings: function () {
        DEBUG = this.settings.get_boolean (DEBUG_KEY);
        AUDIODIR = this.settings.get_string (AUDIO_KEY);
        if (!AUDIODIR) AUDIODIR = Convenience.get_special_dir (GLib.UserDirectory.DIRECTORY_MUSIC);
        VIDEODIR = this.settings.get_string (VIDEO_KEY);
        if (!VIDEODIR) VIDEODIR = Convenience.get_special_dir (GLib.UserDirectory.DIRECTORY_VIDEOS);
    },

    add_watcher: function () {
        if (!installed) return;
        if (clipboard_watcher) {
            GLib.source_remove (clipboard_watcher);
            clipboard_watcher = 0;
        }
        clipboard_watcher = GLib.timeout_add (100, WATCH_TIMEOUT, Lang.bind (this, this.get_clipboard));
    },

    get_clipboard: function () {
        let self = this;
        Clipboard.get_text (CLIPBOARD_TYPE, function (c, text) {
            if (text && text != last_text) {
                last_text = text;
                self.on_new_text ();
            }
        });
        return true;
    },

    on_new_text: function () {
        let ar = last_text.split ("\n");
        uris = [];
        ar.forEach (s=>{
            if (this.is_y2b (s)) uris.push (s.trim ());
        });
        if (uris.length) {
            this.item.set_uri (uris[0]);
        }
    },

    is_y2b: function (text) {
        let uri = new Soup.URI (text), res = true;
        if (!uri) res = false;
        if (res && uri.scheme != "https") res = false;
        if (res && !(uri.host == "www.youtube.com" || uri.host == "youtu.be")) res = false;
        if (res && !uri.path) res = false;
        if (uri) uri = null;
        return res;
    },

    _install: function () {
        let r, pid;
        var pkexec = GLib.find_program_in_path ("pkexec");
        if (!pkexec) return;
        try {
            [r, pid] = GLib.spawn_async (null, [pkexec, EXTENSIONDIR + "/install_ydl.sh"], null,
                GLib.SpawnFlags.SEARCH_PATH | GLib.SpawnFlags.DO_NOT_REAP_CHILD, null);
        } catch (e) {
            show_notification (e.message);
            return;
        }
        if (installID) this.install.disconnect (installID);
        GLib.child_watch_add (GLib.PRIORITY_DEFAULT, pid, Lang.bind (this, function () {
            show_notification ("Installation complete.");
            debug ("Installation complete.");
        }));
    },

    build_menu: function () {
        this.menu.removeAll ();
        
        this.item = new YoutubeItem ();
        this.menu.addMenuItem (this.item);
        this.item.connect ('audio', Lang.bind (this, function (item) {
            if (!installed || !item.uri) return;
            if (GLib.spawn_command_line_async (udl + " -o " + AUDIODIR + "/%(title)s.%(ext)s -x -f m4a " + item.uri))
                show_notification ("Starting " + item.uri);
            else show_notification ("Error " + item.uri);
        }));
        this.item.connect ('video', Lang.bind (this, function (item) {
            if (!installed || !item.uri) return;
            if (GLib.spawn_command_line_async (udl + " -o " + VIDEODIR + "/%(title)s.%(ext)s " + item.uri))
                show_notification ("Starting " + item.uri);
            else show_notification ("Error " + item.uri);
        }));

        this.prefs = new PrefsMenuItem ();
        this.menu.addMenuItem (this.prefs);
        if (!installed) {
            this.install = new PopupMenu.PopupMenuItem ("\u26a0 Install youtube-dl");
            this.menu.addMenuItem (this.install);
            installID = this.install.connect ('activate', Lang.bind (this, function () {
                this._install ();
            }));
        }
    },

    remove_events: function () {
        if (clipboard_watcher != 0) GLib.source_remove (clipboard_watcher);
        clipboard_watcher = 0;
    }
});

const YoutubeItem = new Lang.Class ({
    Name: 'YoutubeItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function (params) {
        this.parent ({ reactive: false, can_focus: false });
        this.vbox = new St.BoxLayout({ vertical: true, style: 'padding: 8px; spacing: 4px;' });
        this.actor.add_child (this.vbox);

        this.label = new St.Label ({text: " ", style: ''});
        this.label.align = St.Align.START;
        this.vbox.add_child (this.label);

        let box = new St.BoxLayout({ vertical: false, style: 'padding: 4px' });
        this.vbox.add (box);
        this.audio_button = new St.Button ({ label: "Audio", style_class: 'audio-button', x_expand:true });
        box.add (this.audio_button);
        this.video_button = new St.Button ({ label: "Video", style_class: 'video-button', x_expand:true});
        box.add (this.video_button);

        this.audio_button.connect ('clicked', Lang.bind (this, function () {
            this.emit ('audio');
            this.activate ();
        }));
        this.video_button.connect ('clicked', Lang.bind (this, function () {
            this.emit ('video');
            this.activate ();
        }));
        this.label.connect ('notify::text', Lang.bind (this, function () {
            this.actor.visible = this.label.text.length > 0;
        }));
        this.set_text ("");
        this.uri = "";
    },

    set_text: function (text) {
        this.label.set_text (text);
    },

    set_uri: function (uri) {
        this.uri = uri;
        this.set_text (uri);
        if (!udl) return;
        var pipe = new SpawnPipe ([udl,"-e",this.uri], null, Lang.bind (this, (stdout, err) => {
            if (stdout.length) this.set_text (stdout[0]);
            else if (err) this.set_text (err);
        }));
    }
});

const PrefsMenuItem = new Lang.Class({
    Name: 'PrefsMenuItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function () {
        this.parent ({ reactive: false, can_focus: false});
        this.actor.add (new St.Label ({text: ' '}), { expand: true });
        this.preferences = new St.Button ({ child: new St.Icon ({ icon_name: 'preferences-system-symbolic' }), style_class: 'system-menu-action'});
        this.actor.add (this.preferences, { expand: true, x_fill: false });
        this.preferences.connect ('clicked', Lang.bind (this, function () {
            GLib.spawn_command_line_async ('gnome-shell-extension-prefs ' + Me.uuid);
            this.emit ('activate');
        }));
        this.actor.add (new St.Label ({text: ' '}), { expand: true });
    }
});

var SpawnPipe = new Lang.Class({
    Name: 'SpawnPipe',

    _init: function (args, dir, callback) {
        debug (args);
        dir = dir || "/";
        let exit, pid, stdin_fd, stdout_fd, stderr_fd;
        this.error = "";
        this.stdout = [];
        this.dest = "";

        try {
            [exit, pid, stdin_fd, stdout_fd, stderr_fd] =
                GLib.spawn_async_with_pipes (dir,args,null,GLib.SpawnFlags.DO_NOT_REAP_CHILD,null);
            GLib.close (stdin_fd);
            let outchannel = GLib.IOChannel.unix_new (stdout_fd);
            GLib.io_add_watch (outchannel,100,GLib.IOCondition.IN | GLib.IOCondition.HUP, (channel, condition) => {
                return this.process_line (channel, condition, "stdout");
            });
            let errchannel = GLib.IOChannel.unix_new (stderr_fd);
            GLib.io_add_watch (errchannel,100,GLib.IOCondition.IN | GLib.IOCondition.HUP, (channel, condition) => {
                return this.process_line (channel, condition, "stderr");
            });
            let watch = GLib.child_watch_add (100, pid, Lang.bind (this, (pid, status, o) => {
                debug ("watch handler " + pid + ":" + status + ":" + o);
                GLib.source_remove (watch);
                GLib.spawn_close_pid (pid);
                if (callback) callback (this.stdout, this.error);
            }));
        } catch (e) {
            error (e);
        }
    },

    process_line: function (channel, condition, stream_name) {
        if (condition == GLib.IOCondition.HUP) {
            debug (stream_name, ": has been closed");
            return false;
        }
        try {
            var [,line,] = channel.read_line (), i = -1;
            if (line) {
                debug (stream_name, line);
                if (stream_name == "stderr") {
                    this.error = line;
                } else {
                    this.stdout.push (line);
                }
            }
        } catch (e) {
             return false;
        }
        return true;
    }
});

function check_install_udl () {
    udl = GLib.find_program_in_path ("youtube-dl");
    if (udl) installed = true;
}

let notify_source = null;
function init_notify () {
    if (notify_source) return;
    notify_source = new MessageTray.Source ("You2berIndicator", "applications-internet");
    notify_source.connect ('destroy', Lang.bind (this, function () {
        notify_source = null;
    }));
    Main.messageTray.add (notify_source);
}

function show_notification (message) {
    let notification = null;

    init_notify ();

    notification = new MessageTray.Notification (notify_source, message);
    notification.setTransient (true);
    notify_source.notify (notification);
}


function debug (msg) {
    if (DEBUG) Convenience.debug (msg);
}

function error (msg) {
    Convenience.error (msg);
}

let uindicator;

function init () {
}

function enable () {
    uindicator = new U2Indicator;
    Main.panel.addToStatusArea ("u2ber-indicator", uindicator);
}

function disable () {
    uindicator.remove_events ();
    uindicator.destroy ();
    uindicator = null;
}
