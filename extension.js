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

const EXTENSIONDIR = Me.dir.get_path ();

let MUSICDIR = GLib.get_user_special_dir (GLib.UserDirectory.DIRECTORY_MUSIC);
//let VIDEODIR = GLib.get_user_special_dir (GLib.UserDirectory.DIRECTORY_VIDEOS);

const WATCH_TIMEOUT = 1000;

let clipboard_watcher = 0;
let installed = false;
let udl = null;
let last_text = "";
let uris = [];

const U2Indicator = new Lang.Class({
    Name: "U2Indicator",
    Extends: PanelMenu.Button,

    _init: function () {
        this.parent (0.0, "Gnome Youtube Downloader", false);
        
        if (!MUSICDIR) MUSICDIR = GLib.get_home_dir ();
        MUSICDIR += "/youtube";
        if (!GLib.file_test (MUSICDIR, GLib.FileTest.EXISTS))
            GLib.mkdir_with_parents (MUSICDIR, 484);
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
            this.get_clipboard ();
        }));

        this.build_menu ();
        //this.add_watcher ();
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
            this.item.set_text (uris[0]);
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

    build_menu: function () {
        this.menu.removeAll ();
        
        this.item = new YoutubeItem ("");
        this.menu.addMenuItem (this.item);
        this.item.connect ('activate', Lang.bind (this, function (item) {
            if (!installed) return;
            let args = [udl,"-o","%(title)s.%(ext)s","-x",item.label.text];
            let task = new SpawnPipe (args, MUSICDIR);
        }));

        this.menu.addMenuItem (new SeparatorItem ());
        if (!installed) {
            this.install = new PopupMenu.PopupMenuItem ("\u26a0 Install youtube-dl");
            this.menu.addMenuItem (this.install);
        }
    },

    remove_events: function () {
        if (clipboard_watcher != 0) GLib.source_remove (clipboard_watcher);
        clipboard_watcher = 0;
    }
});

const YoutubeItem = new Lang.Class ({
    Name: 'YoutubeItem',
    Extends: PopupMenu.PopupMenuItem,

    _init: function (label, style) {
        this.parent (" ", {style_class:style?style:'y2b-item'});
        this.label.connect ('notify::text', Lang.bind (this, function () {
            this.actor.visible = this.label.text.length > 0;
        }));
        this.set_text (label);
    },

    set_text: function (text) {
        this.label.set_text (text);
    }
});

const SeparatorItem = new Lang.Class({
    Name: 'SeparatorItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function () {
        this.parent({reactive: false, can_focus: false, style_class: 'y2b-separator-item'});
        this._separator = new St.Widget({ style_class: 'y2b-separator-menu-item',
                                          y_expand: true,
                                          y_align: 2 });
        this.actor.add(this._separator, {expand: true});
    }
});

var SpawnPipe = new Lang.Class({
    Name: 'SpawnPipe',

    _init: function (args, dir) {
        print (args);
        dir = dir || "/";
        let exit, pid, stdin_fd, stdout_fd, stderr_fd;
        this.error = "";
        this.dest = "";

        try{
            [exit, pid, stdin_fd, stdout_fd, stderr_fd] = GLib.spawn_async_with_pipes (dir,
                                            args,
                                            null,
                                            GLib.SpawnFlags.DO_NOT_REAP_CHILD,
                                            null);
            GLib.close (stdin_fd);
            let outchannel = GLib.IOChannel.unix_new (stdout_fd);
            GLib.io_add_watch (outchannel,0,GLib.IOCondition.IN | GLib.IOCondition.HUP, (channel, condition) => {
                return this.process_line (channel, condition, "stdout");
            });
            let errchannel = GLib.IOChannel.unix_new (stderr_fd);
            GLib.io_add_watch (errchannel,0,GLib.IOCondition.IN | GLib.IOCondition.HUP, (channel, condition) => {
                return this.process_line (channel, condition, "stderr");
            });
            let watch = GLib.child_watch_add (GLib.PRIORITY_DEFAULT, pid, Lang.bind (this, (pid, status, o) => {
                print ("watch handler " + pid + ":" + status + ":" + o);
                GLib.source_remove (watch);
                GLib.spawn_close_pid (pid);
                if (status == 0) show_notification ("Download complete.\n" + this.dest);
                else show_notification ("Download error: " + status + "\n" + this.error);
            }));
        } catch (e) {
            print (e);
        }
    },

    process_line: function (channel, condition, stream_name) {
        if (condition == GLib.IOCondition.HUP) {
            print (stream_name, ": has been closed");
            return false;
        }
        try {
            var [,line,] = channel.read_line (), i = -1;
            if (line) {
                print (stream_name, line);
                if (stream_name == "stderr") {
                    this.error = line;
                } else {
                    i = line.indexOf ("Destination:")
                    if (i > -1) {
                        this.dest = line.substring(i+12).trim ();
                    }
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
