# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

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