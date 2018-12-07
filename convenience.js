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

const LANGS = [
"af","am","ar","az","be","bg","bn","bs","ca","ceb","co","cs","cy","da","de","el","en",
"eo","es","et","eu","fa","fi","fil","fr","fy","ga","gd","gl","gu","ha","haw","hi","hmn",
"hr","ht","hu","hy","id","ig","is","it","iw","ja","jv","ka","kk","km","kn","ko","ku",
"ky","la","lb","lo","lt","lv","mg","mi","mk","ml","mn","mr","ms","mt","my","ne","nl",
"no","ny","pa","pl","ps","pt","pt-br","ro","ru","sd","si","sk","sl","sm","sn","so","sq",
"sr","st","su","sv","sw","ta","te","tg","th","tr","uk","ur","uz","vi","xh","yi","yo",
"zh-hans","zh-hant","zu"
];

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

function fetch (url, agent, headers, callback) {
  callback = callback || null;
  agent = agent || "You2ber (GNU/Linux)";

  let session = new Soup.SessionAsync({ user_agent: agent });
  Soup.Session.prototype.add_feature.call (session, new Soup.ProxyResolverDefault());
  let request = Soup.Message.new ("GET", url);
  if (headers) headers.forEach (h=>{
    request.request_headers.append (h[0], h[1]);
  });
  session.queue_message (request, (source, message) => {
    if (callback)
      callback (message.response_body_data.get_data (), message.status_code);
  });
}

let ydl = "";
let current_version = "";
let latest_version = "";
function check_install_ydl () {
  print ("check_install_ydl");
  let path = get_user_bin_dir ();
  path = GLib.build_filenamev ([path,"youtube-dl"]);
  let file = Gio.File.new_for_path (path);
  if (!file.query_exists (null))
    return false;
  let info = file.query_info ("*", 0, null);
  if (!info.get_attribute_boolean (Gio.FILE_ATTRIBUTE_ACCESS_CAN_EXECUTE)) {
    info.set_attribute_boolean (Gio.FILE_ATTRIBUTE_ACCESS_CAN_EXECUTE, true);
    let cmd = GLib.find_program_in_path ("chmod");
    if (!cmd) return false;
    GLib.spawn_command_line_sync (cmd + " a+rx " + path);
    if (!info.get_attribute_boolean (Gio.FILE_ATTRIBUTE_ACCESS_CAN_EXECUTE))
      return false;
  }
  ydl = path;
  latest_version = current_version = get_info_string (ydl + " --version");

  return true;
}

function install_ydl (callback) {
  print ("install_ydl");
  fetch ("https://yt-dl.org/downloads/latest/youtube-dl",
    "You2ber (GNU/Linux)", null, Lang.bind (this, (data, s) => {
      if ((s == 200) && data) {
        let file = Gio.File.new_for_path (get_user_bin_dir () + "/youtube-dl");
        file.replace_contents_bytes_async (
          data, null, false, Gio.FileCreateFlags.REPLACE_DESTINATION, null, (o, res) => {
            file.replace_contents_finish (res);
            check_install_ydl ();
            if (callback) callback ();
          }
        );
      }
      return false;
  }));
  return true;
}

function check_update_ydl (callback) {
  print ("check_update_ydl");
  fetch ("https://rg3.github.io/youtube-dl/update/LATEST_VERSION",
    "You2ber (GNU/Linux)", null, Lang.bind (this, (text, s) => {
      if ((s == 200) && text) {
        latest_version = bytesToString (text).toString().split("\n")[0];
      }
      if (callback) callback (latest_version == current_version);
      return false;
  }));
}

function get_user_bin_dir () {
  let path = GLib.build_filenamev ([GLib.get_home_dir (), ".local/bin"]);
  if (!GLib.file_test (path, GLib.FileTest.EXISTS))
    GLib.mkdir_with_parents (path, 484);
  return path;
}

function bytesToString (array) {
  return array instanceof Uint8Array ? ByteArray.toString (array) : array;
}

let cmd_out, info_out;
function get_info_string (cmd) {
  cmd_out = GLib.spawn_command_line_sync (cmd);
  if (cmd_out[0]) info_out = bytesToString (cmd_out[1]).toString().split("\n")[0];
  if (info_out) return info_out;
  return "";
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
