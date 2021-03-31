# Basic Makefile

UUID = you2ber@konkor
BASE_MODULES = metadata.json prefs.js stylesheet.css BACKERS.md extension.js convenience.js README.md LICENSE preferences Preferences.js
EXTRA_MEDIA = data/icons/u2b.svg \
              data/icons/000.svg \
              data/icons/025.svg \
              data/icons/050.svg \
              data/icons/075.svg \
              data/icons/100.svg

ifeq ($(strip $(DESTDIR)),)
	INSTALLBASE = $(HOME)/.local/share/gnome-shell/extensions
	RMTMP = echo Not deleting tmp as installation is local
else
	INSTALLBASE = $(DESTDIR)/usr/share/gnome-shell/extensions
	RMTMP = rm -rf ./_build/tmp
endif

all: zip-file

clean:
	rm -f ./schemas/gschemas.compiled
	rm -f ./po/*.mo

extension: ./schemas/gschemas.compiled

./schemas/gschemas.compiled: ./schemas/org.konkor.you2ber.gschema.xml
	glib-compile-schemas ./schemas/

install: install-local

install-local: _build
	mkdir -p $(INSTALLBASE)/$(UUID)/tmp
	cp -r $(INSTALLBASE)/$(UUID)/tmp ./_build/.
	$(RMTMP)
	rm -rf $(INSTALLBASE)/$(UUID)
	mkdir -p $(INSTALLBASE)/$(UUID)
	cp -r ./_build/* $(INSTALLBASE)/$(UUID)/
	-rm -fR _build
	echo done

zip-file: _build
	cd _build ; \
	zip -qr "$(UUID)$(VSTRING).zip" .
	mv _build/$(UUID)$(VSTRING).zip ./
	-rm -fR _build

_build: extension
	-rm -fR ./_build
	mkdir -p _build
	cp $(BASE_MODULES) _build
	mkdir -p _build/data/icons
	cp $(EXTRA_MEDIA) _build/data/icons/
	mkdir -p _build/schemas
	cp schemas/*.xml _build/schemas/
	cp schemas/gschemas.compiled _build/schemas/
