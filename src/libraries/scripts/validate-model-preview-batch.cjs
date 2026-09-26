// Runs the real batch component with mocked React, WebGL capture and API responses.
const fs = require('fs'), vm = require('vm'), ts = require('typescript'), assert = require('assert/strict');
async function test(cancel = false, fail = false, limit = 10) {
    const state = [], refs = [], nodes = [];
    let si = 0, ri = 0, Component, queued = false;
    const captured = [], saved = [];
    let uploads = 0, pages = 0;
    const reads = {};
    function render() { queued = false; si = ri = 0; nodes.length = 0; Component({ onComplete() { } }); const p = nodes.find(n => n.type === 'ThreeDModelAssetPreview'); if (p && p.props.autoCapture && !captured.includes(p.props.model.id)) {
        captured.push(p.props.model.id);
        if (cancel)
            nodes.find(n => n.type === 'Button' && JSON.stringify(n.props.children).includes('Cancel after current')).props.onClick();
        queueMicrotask(() => p.props.onCaptureImage(new Blob(['png'])));
    } }
    const react = { useMemo(fn) { return fn(); }, useEffect() { }, useRef(v) { return refs[ri++] ||= ({ current: v }); }, useState(v) { const i = si++; if (!(i in state))
            state[i] = v; return [state[i], v => { state[i] = typeof v === 'function' ? v(state[i]) : v; if (!queued) {
                queued = true;
                queueMicrotask(render);
            } }]; } };
    const jsx = (type, props) => { const n = { type, props }; nodes.push(n); return n; };
    const module = { exports: {} };
    const code = ts.transpileModule(fs.readFileSync('src/components/admin/threed/models/ModelPreviewBatchExport.tsx', 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2022 } }).outputText;
    vm.runInNewContext(code, { module, exports: module.exports, Blob, FormData, AbortSignal, setTimeout, clearTimeout, require: n => n === 'react' ? react : n === 'react/jsx-runtime' ? { jsx, jsxs: jsx } : n === './model-preview-requirements' ? { resolvePreviewRequirements: (_, requirements) => requirements } : n.endsWith('/ModelPreviewSettings') ? { useModelPreviewSize: () => ({ width: 400, height: 400 }), validPreviewSize: v => [v.width, v.height].every(n => Number.isInteger(n) && n >= 64 && n <= 2048) } : new Proxy({}, { get: (_, k) => k }), fetch: async (url, init = {}) => {
            let data;
            if (url.includes('limit=')) {
                pages++;
                return { ok: true, json: async () => ({ success: true, data: pages === 1 ? [{ id: 1, thumbnailUrl: 'exists' }, { id: 2, modelName: 'new' }] : [{ id: 3, modelName: 'concurrent' }, { id: 4, modelName: 'missing' }], pagination: { total: 4 } }) };
            }
            if (url.includes('/upload')) {
                uploads++;
                data = { url: 'https://test/preview.png' };
            }
            else if (url.includes('requirements'))
                data = { requirements: [{ satisfied: !url.endsWith('=4') }] };
            else {
                const id = Number(new URL(url, 'http://test').searchParams.get('id'));
                if (init.method === 'PATCH') {
                    assert.deepEqual(Object.keys(JSON.parse(init.body)), ['thumbnailUrl']);
                    if (fail)
                        return { ok: false, json: async () => ({ success: false, error: 'rejected' }) };
                    saved.push(id);
                    data = {};
                }
                else {
                    reads[id] = (reads[id] || 0) + 1;
                    data = { id, filePath: 'test.fbx', modelType: 'fbx', thumbnailUrl: id === 3 && reads[id] > 1 ? 'newly-added' : null };
                }
            }
            return { ok: true, json: async () => ({ success: true, data }) };
        } });
    Component = module.exports.ModelPreviewBatchExport;
    render();
    nodes.find(n => n.type === 'Button' && n.props.children === 'Find Models').props.onClick();
    for (let i = 0; i < 100 && (state[12] || queued); i++) await new Promise(r => setImmediate(r));
    assert.equal(uploads, 0, 'query never uploads');
    assert.equal(saved.length, 0, 'query never assigns images');
    assert.equal(state[10].length, 3, 'checklist contains missing previews across pages');
    assert.equal(state[11].length, 0, 'query leaves all Models unchecked');
    state[14] = { model: { id: 2, modelName: 'sample' }, total: 0, attached: 0 };
    state[16] = true; state[9] = limit;
    state[8] = { width: 640, height: 320 };
    render();
    const sample = nodes.find(n => n.type === 'ThreeDModelAssetPreview');
    assert.equal(sample.props.outputSize.width, 640);
    assert.equal(sample.props.outputSize.height, 320);
    assert.equal(uploads, 0, 'camera review never uploads');
    const start = () => nodes.find(n => n.type === 'Button' && JSON.stringify(n.props.children).includes('Start batch'));
    state[11] = [2];
    state[14] = { model: { id: 2 }, total: 1, attached: 0, textures: 0, missing: ['geometry.bin'] }; state[16] = false; render();
    assert.equal(start().props.disabled, true, 'missing assets block Start');
    assert.ok(nodes.some(n => typeof n.props.children === 'string' && n.props.children.includes('missing geometry or material files')), 'blocked reason is visible');
    state[14] = { model: { id: 2 }, total: 0, attached: 0, missing: [] }; state[16] = true;
    state[11] = []; render(); assert.equal(start().props.disabled, true, 'empty checklist blocks run');
    state[11] = [2, 3, 4]; state[8] = { width: 0, height: 320 }; render();
    assert.equal(start().props.disabled, true, 'invalid dimensions block run');
    state[8] = { width: 640, height: 320 }; state[18] = { direction: [1, 2, 3], distanceScale: 0.7 }; render();
    assert.equal(start().props.disabled, true, 'unapplied perspective blocks run');
    nodes.find(n => n.type === 'Button' && n.props.children === 'Use this perspective').props.onClick();
    await new Promise(r => setImmediate(r));
    const applied = nodes.find(n => n.type === 'ThreeDModelAssetPreview');
    assert.equal(applied.props.perspective.distanceScale, 0.7);
    start().props.onClick();
    for (let i = 0; i < 100 && (state[2] || queued); i++)
        await new Promise(r => setImmediate(r));
    assert.equal(state[2], false);
    assert.equal(pages, 2);
    assert.equal(uploads, 1);
    assert.deepEqual(saved, fail ? [] : [2]);
    assert.equal(state[6][0].status, fail ? 'Failed' : 'Saved');
    if (cancel || limit === 1)
        assert.equal(state[6].length, 1);
    else {
        assert.equal(state[6][1].status, 'Skipped');
        assert.equal(state[6][2].status, 'Skipped');
    }
}
(async () => { await test(); await test(true); await test(false, true); await test(false, false, 1); console.log('PASS query/review without writes, checklist gating, dimensions, limit, pagination, skip, cancel and failed-save cases'); })().catch(e => { console.error(e); process.exitCode = 1; });

// Reproduce the cleared Canvas host ref without mounting a browser renderer.
{
    const eventModule = { exports: {} };
    const connections = [];
    let disconnects = 0;
    const source = fs.readFileSync('src/components/admin/threed/models/model-preview-events.ts', 'utf8');
    const output = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
    vm.runInNewContext(output, { exports: eventModule.exports, require: () => ({ events: () => ({
        connect: target => { assert.ok(target); connections.push(target); },
        disconnect: () => { disconnects++; },
    }) }) });
    const manager = eventModule.exports.modelPreviewEvents({});
    const element = {};
    manager.connect(element);
    manager.connect(null);
    manager.connect(element);
    assert.deepEqual(connections, [element, element], 'live targets still connect after a cleared ref');
    assert.equal(disconnects, 1, 'cleared target disconnects without registering listeners');
    console.log('PASS preview event connection with live and cleared DOM targets');
}
