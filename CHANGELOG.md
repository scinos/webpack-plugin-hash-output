# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## 3.2.1 - 2019-01-23

### Fixes

- Fixed a potential bug while searching for the main file in a chunk (thanks @liamcmitchell-sc)

### Added

- Display a warning if there are other pluging registered to run in the `emit` phase
  and we are not the first in the list.

## 3.2.0 - 2018-11-25

### Added

- Display a warning if there are other pluging registered to run in the `emit` phase
  and we are not the first in the list.

## 3.1.3 - 2018-11-23

### Chores

- Updated chai to 4.2.0
- Updated css-loader to 1.0.1
- Updated eslint to 5.9.0
- Updated eslint-config-airbnb-base to 13.1.0
- Updated eslint-plugin-import to 2.14.0
- Updated eslint-plugin-mocha to 5.2.0
- Updated mini-css-extract-plugin to 0.4.5
- Updated mocha to 5.2.0
- Updated webpack to 4.26.0
- Updated webpack-cli to 3.1.2
- Updated node to 6.14.4
- Added prettier
- Changed the code style of many files to conform to prettier
- Added base webpack config to tests to avoid some duplication
- Added LICENSE.txt, CODE_OF_CONDUCT.md
- Added .npmignore to reduce the package size

## 3.1.2 - 2018-11-23

- Burnt version, ignore

## 3.1.1 - 2018-11-16

### Fixes

 - Port changes from 1.3.1

## 1.3.1 - 2018-11-16

### Fixes

 - The plugin runs on `emit` phase instead of `after-optimize-chunk-assets`. This will give more
   "room" to other plugins to change the output before we compute the hash (thanks @pksjce!)

## 3.1.0 - 2017-05-09

### Added
 - Added support for mini-css-extract-plugin. (#17, thanks to @GoodForOneFare)

### Changed
 - Simplified logic for sorting chunks before hashing. (#18, thanks to @GoodForOneFare)


## 3.0.0 - 2017-04-14

### Changed
 - Reworked algorithm to detect file dependencies to avoid #16. This new algorithm makes the option
  `manifestFiles` unnecessary.

### Fixed
 - Fixes bug causing an infinite loop in some projects (#16)

### Removed
 - Option `manifestFiles` has been removed. The plugin will find all manifest files automatically.


## 2.1.0 - 2017-04-09

### Added
 - Support for circular async dependencies (#15)


## 2.0.0 - 2017-03-15

### Breaking changes
- This plugin requires Webpack 4 now.

### Added
- Support for runtimeChunk