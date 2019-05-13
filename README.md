# Dependency Version Checker

This library allows you to run a check for newer versions against all your `git+ssh://` and `git://` dev and production dependencies.

It does now work for npm installed dependencies (yet?), if you want to check those I would suggest you to use libraries like `ncu`.

## Motivation
Internal libraries or other dependencies should be as easy to verify as those published to npm.

## Prerequisites
If you're able to clone the repo, you're able to check the tags.

Configure your git and ssh in you have private repos.  

## Installation
`npm install -g git://github.com/tmakuch/dependency-version-checker.git`

## Usage
Run in your project (you do not need to be exactly in root):

`check-dep-versions [rule]`

* Rule parameter is a string by which successful match against the dependencies.
* Rule parameter may be omitted, but check will be executed against all the dependencies.
  
#### Example from the "tests"

```
$check-dep-versions lod
Performing dependency updates check for project: ~\Projects\depdency-version-checker\tests\testProj1\package.json.
Check will be performed for dependencies matching this regex: /lod/.

You could update 1 dependency(/-ies). 

Dependency  Type  Current Version  Latest Minor  Latest Major  
==========  ====  ===============  ============  ============  
lodash      Prod  3.0.0            3.10.1        4.17.11       
```

#### Debugging

Run `check-dep-versions --help` to see additional flags.