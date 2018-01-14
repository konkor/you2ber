/* -*- mode: js; js-basic-offset: 4; indent-tabs-mode: nil -*- */
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
const Soup = imports.gi.Soup;
const Gettext = imports.gettext;

var Format = imports.format;
String.prototype.format = Format.format;

function initTranslations (domain) {
    domain = domain || 'org-konkor-you2ber';

    let localeDir = Gio.File.new_for_path (getCurrentFile()[1] + '/locale');
    if (localeDir.query_exists (null))
        Gettext.bindtextdomain (domain, localeDir.get_path());
    else
        Gettext.bindtextdomain (domain, '/usr/share/locale');
}

function getSettings (schema) {
    schema = schema || 'org.konkor.you2ber';

    const GioSSS = Gio.SettingsSchemaSource;

    let schemaDir = Gio.File.new_for_path (getCurrentFile()[1] + '/schemas');
    let schemaSource;
    if (schemaDir.query_exists(null))
        schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
                                                 GioSSS.get_default(),
                                                 false);
    else
        schemaSource = GioSSS.get_default();

    let schemaObj = schemaSource.lookup(schema, true);
    if (!schemaObj)
        throw new Error('Schema ' + schema + ' could not be found for extension '
                        + 'you2ber@konkor. Please check your installation.');

    return new Gio.Settings({ settings_schema: schemaObj });
}

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

function get_special_dir (dir) {
    let folder = GLib.get_user_special_dir (dir);
    if (!folder) folder = GLib.get_home_dir ();
    folder += "/youtube";
    if (!GLib.file_test (folder, GLib.FileTest.EXISTS))
        GLib.mkdir_with_parents (folder, 484);

    return folder;
}

//DOMAIN ERROR:0:RED, INFO:1:BLUE, DEBUG:2:GREEN
const domain_color = ["00;31","00;34","00;32"];
const domain_name = ["EE","II","DD"];

function info (source, msg) {
    print_msg (1, source, msg);
}

function debug (source, msg) {
    print_msg (2, source, msg);
}

function error (source, msg) {
    print_msg (0, source, msg);
}

function print_msg (domain, source, output) {
    let ds = new Date().toString ();
    let i = ds.indexOf (" GMT");
    if (i > 0) ds = ds.substring (0, i);

    if (domain == 2) print ("\x1b[%sm[%s](%s) [you2ber][%s]\x1b[0m %s".format (
        domain_color[domain],ds,domain_name[domain],source,output));
    else log ("(%s) [you2ber][%s] %s".format (domain_name[domain], source, output));
}


