<p align="center">
  <a href="https://github.com/konkor/you2ber"><img src="https://img.shields.io/github/license/konkor/you2ber.svg" alt="GPLv3 License"></a>
  <a href="https://github.com/konkor/you2ber"><img src="https://img.shields.io/github/stars/konkor/you2ber.svg?style=social&label=Star&style=flat-square" alt="Stars"></a>
</p>

# [YOU2BER](https://extensions.gnome.org/extension/you2ber/) <img alt="logo" src="/data/icons/u2b.png" align="right">
**GNOME SHELL EXTENSION** for [youtube-dl](https://github.com/rg3/youtube-dl).
-----

<h2 align="center">Supporting YOU2BER</h2>

YOU2BER is an GPLv3-licensed open source project focused on desktop users. It's an independent project with its ongoing development made possible entirely thanks to the support by these awesome [backers](https://github.com/konkor/you2ber/blob/master/BACKERS.md). You will also support my other interesting community projects. If you'd like to help the project and want to join to it, please consider:

- [Become a backer or sponsor on Patreon](https://www.patreon.com/konkor).
- [One-time donation via PayPal or Patreon.](#donations)

Please, consider to support the project and make it better!

<h3 align="center">Special Sponsors</h3>
<!--special start-->

<p align="center">
  <big>
    Top 5 Supporters could be here with your name or logo and reference.
    <br><br>
    <i>Also the one top will be placed in GUI like 'Sponsored by ...' while there's no one real sponsor!</i>
  </big>
</p>

![screencast](/screenshots/screenshot.png)

**YOU2BER** helps to download media content from online video services and convert to usable format.

## Main Features
* Clipboard support.
* Audio extraction to _~/Music/youtube_ folder.
* Video extraction to _~/Videos/youtube_ folder.

## How-to use
1. Copy valid URI address to the clipboard buffer
2. Open the extension menu and select a desired audio or video stream.

## Contributions
* Report [a bug](https://github.com/konkor/you2ber/issues).
* Test it on your favorite Linux distribution.
* Contribute with an idea, graphical content, translation or code [an issue](https://github.com/konkor/you2ber/issues).
* Make donation to the project.

## Donations
Please, consider to support the author seriously at least temporary or one time. It's an independent open software project. It means there is no any organization or company behind it to support it except generous users. The time for the development, supporting, debugging, testing is not less then for any other project. Otherwise the project could have only spontaneous updates and supporting until it just die. **All donations is for all open-source projects of the autor.**

 * [Become a backer or sponsor on Patreon](https://www.patreon.com/konkor)
 * [PayPal EURO](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=WVAS5RXRMYVC4)
 * [PayPal USD](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=HGAFMMMQ9MQJ2)
 * Contact to the author [here](https://konkor.github.io/index.html#contact)

_Behind the development for the Linux Desktop are ordinary people who spend a lot of time and their own resources to make the Linux Desktop better. Thank you for your contributions!_


## Installation
### Dependencies
* [youtube-dl](https://github.com/rg3/youtube-dl)
* Gnome Shell 3.14+

### Recommends
* ffmpeg (youtube-dl dependency for media manipulation)

Linux installation:
```
sudo wget https://yt-dl.org/downloads/latest/youtube-dl -O /usr/local/bin/youtube-dl
sudo chmod a+rx /usr/local/bin/youtube-dl
```

### Install from GitHub branch (default master)
1. Download
```
wget https://github.com/konkor/you2ber/archive/master.zip
```
2. Unpack this archive to `/.local/share/gnome-shell/extensions/you2ber@konkor` or install in the _gnome-tweak-tool_
3. Restart Gnome to reload extensions by:
 * user's **Log-out/Log-in** (_X11/Wayland_)
 * <kbd>Alt</kbd>+<kbd>F2</kbd> and enter <kbd>r</kbd> command (_X11 only_)
 * or just **reboot** PC (_X11/Wayland_)
4. Turn on the extension
 * [local extensions page](https://extensions.gnome.org/local/)
 * or `gnome-shell-extension-prefs` tool
 * or in the `gnome-tweak-tool`

[More about compilation and installation...](https://github.com/konkor/obmin/blob/master/INSTALL.md)

### Sources and binary packages
* [GitHub master branch](https://github.com/konkor/you2ber/archive/master.zip)
