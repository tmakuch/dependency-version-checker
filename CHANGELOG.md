# Changelog

## 1.0.1 - 2019.06.26
### Fixed
* Custom (non-semver) tags in history were breaking the whole check. Currently they are omitted and only debug is pasted (when on --verbose) in the console.

## 1.0.0 - 2019.05.19
### Changed
* CLI entry `check-dep-versions` was changed to `dep-versions` and work with commands `dep-versions check` and `dep-version update`.
* Multiple flags were changes, see `--help` for command you want to use. 
### Added
* `dep=versions update` command to save the updates in package.json.
* `dep-versions check` perform self-check (use `--no-self-check` to omit it). 
* `--silent` to hide everything that's not table with results.