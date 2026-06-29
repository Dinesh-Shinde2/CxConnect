# IVR Flow Builder Configuration

The authenticated IVR test is data-driven. Edit
[`config/ivr-flow.config.js`](./config/ivr-flow.config.js) to change the flow;
the test file should normally not need editing.

## Run the test

Authentication state must exist at `playwright/.auth/user.json` and
`playwright/.auth/sessionStorage.json`.

```powershell
npx playwright test tests/ivr/ivr-flow-builder-authenticated.spec.js --project=chromium-authenticated --headed
```

Diagnostic specs are kept separately in `tests/ivr/diagnostics` and are excluded
from normal browser and authenticated suites. Run them explicitly when debugging:

```powershell
npm run test:ivr:diagnostics:headed
```

## Configuration structure

```js
const ivrFlowConfig = {
  test: {
    namePrefix: 'AutoIVR',
    timeoutMs: 180000,
    deploy: true,
    expectedStatus: 'ACTIVE'
  },
  nodes: [/* node objects */],
  connections: [/* connection objects */]
};
```

Set `test.deploy: false` to save only a draft. `expectedStatus` is checked only
when deployment is enabled.

## Add, remove, or disable a node

Each node requires a unique `title`, a supported `type`, and canvas coordinates
`x` and `y`. `config` contains the fields filled in the node property panel.

```js
{
  title: 'Play Prompt 2',
  type: 'PLAY_PROMPT',
  x: 700,
  y: 300,
  config: { audioFile: 'welcomivrtest' }
}
```

- Add: append a node object and its required connections.
- Remove permanently: delete the node and every connection that mentions its title.
- Disable temporarily: add `enabled: false` to both the node and its related connections.
- Rename: update the node `title` and all matching `from`/`to` values.

The factory validates these relationships before it changes the canvas.

## Supported node types and fields

| Type | Palette block | `config` fields |
|---|---|---|
| `START` | Start | No configuration |
| `END` | End | No configuration |
| `PLAY_PROMPT` | Play Prompt | `audioFile` |
| `MENU_BLOCK` | Menu Block | `menuPrompt`, `options`, `invalidPrompt`, `noInputPrompt`, `maxRetryPrompt`, `timeout`, `retryCount` |
| `COLLECT_DTMF` | Collect DTMF Input | `minDigits`, `maxDigits`, `terminationKey`, `timeout`, `retryCount`, `invalidPrompt` |
| `DECISION` | Decision / If | `expression` |
| `TRANSFER_TO_QUEUE` | Transfer to Queue | `queue` |
| `WAIT_DELAY` | Wait / Delay | Property automation not implemented yet |
| `GOTO_FLOW` | Goto Flow / Subflow | Property automation not implemented yet |
| `REST_API_CALL` | REST API Call | Property automation not implemented yet |
| `SET_VARIABLE` | Set Variable | Property automation not implemented yet |
| `GET_VARIABLE` | Get Variable | Property automation not implemented yet |

Nodes whose property automation is not implemented can still be placed and
connected when they have no `config` object. To populate those property panels,
add a method in `PropertyPanel.js` and route that type in `IVRFactory.js`.

Audio and queue names must already exist in the selected environment and must
match the UI option text.

## Field examples

```js
// Menu Block
config: {
  menuPrompt: 'menu123',
  options: ['1', '2', '3'],
  invalidPrompt: 'invalidinputivr',
  noInputPrompt: 'maxretry',
  maxRetryPrompt: 'maxretry',
  timeout: 5000,
  retryCount: 4
}

// Collect DTMF
config: {
  minDigits: 1,
  maxDigits: 4,
  terminationKey: '#',
  timeout: 5000,
  retryCount: 3,
  invalidPrompt: 'invalidinputivr'
}

// Decision
config: { expression: "${dtmf_input} == '1'" }

// Transfer to Queue
config: { queue: 'STT Queue' }
```

## Connect nodes

A normal connection uses the source node's default output handle:

```js
{ from: 'Play Prompt 1', to: 'Menu 1' }
```

A Decision connection must specify `branch: 'true'` or `branch: 'false'`:

```js
{ from: 'Decision 1', to: 'Transfer to Queue 1', branch: 'true' }
{ from: 'Decision 1', to: 'Play Prompt 2', branch: 'false' }
```

Menu edges are positional. Their order in `connections` must match the order in
`config.options`. For `options: ['1', '2', '3']`, the first Menu connection is
option 1, the second is option 2, and the third is option 3.

Every `from` and `to` value must exactly match an enabled node title. A connection
can also be temporarily skipped:

```js
{ from: 'Menu 1', to: 'Decision 3', enabled: false }
```

## Example: add one more Decision and Transfer to Queue

To create a fourth Menu branch, first add option `4` in the `Menu 1` configuration:

```js
options: ['1', '2', '3', '4'],
```

Then add these two objects to the `nodes` array:

```js
{
  title: 'Decision 4',
  type: 'DECISION',
  x: 1200,
  y: 400,
  config: { expression: "${menu_input} == '4'" }
},
{
  title: 'Transfer to Queue 4',
  type: 'TRANSFER_TO_QUEUE',
  x: 1200,
  y: 540,
  config: { queue: 'STT Queue' }
}
```

Add the fourth Menu connection immediately after the existing three Menu
connections. Its position is important because Menu outputs follow array order:

```js
{ from: 'Menu 1', to: 'Collect DTMF 1' }, // option 1
{ from: 'Menu 1', to: 'Decision 2' },     // option 2
{ from: 'Menu 1', to: 'Decision 3' },     // option 3
{ from: 'Menu 1', to: 'Decision 4' },     // option 4
```

Finally, connect the new Decision's true branch to the new Queue:

```js
{
  from: 'Decision 4',
  to: 'Transfer to Queue 4',
  branch: 'true'
}
```

If the false branch is also required, add another target node and connection with
`branch: 'false'`. Keep generated titles sequential (`Decision 1`, `Decision 2`,
and so on), because the UI assigns node numbers in drag-and-drop order.

## Current flow

```text
Start 1 -> Play Prompt 1 -> Menu 1
                              |-- option 1 -> Collect DTMF 1 -> Decision 1 (true) -> Queue 1
                              |-- option 2 -> Decision 2 (true) -> Queue 2
                              `-- option 3 -> Decision 3 (true) -> Queue 3
```

Node and edge assertions are calculated from the enabled configuration, so their
expected counts stay correct when entries are added, removed, or disabled.
