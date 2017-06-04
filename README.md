# Probe
Simple application, displaying different views of profiling data.

### Install
Download a latest release from https://github.com/aocenas/probe/releases. To get
profiling data from you need a profiling agent. At this point only
[python agent](https://github.com/aocenas/probe-agent-py) exists. See agent
instructions for how to install and use.

### Build
```bash
yarn build
```

### Run
```bash
yarn electron
```

### Create release
```bash
yarn release
```

A release will be created under `release/<platform>/Probe.app`. At this time
only MacOS is supported.