const crypto = require('crypto');
const webpack = require('webpack');
const path = require('path');
const expect = require('chai').expect;
const rimraf = require('rimraf');
const fs = require('fs');

// Each compilation may use a different hash fn, so we need to generate one from the webpack
// outputOptions.
const makeHashFn = ({
    hashFunction = 'md5',
    hashDigest = 'hex',
    hashDigestLength = 20,
    hashSalt = null,
} = {}) => (input) => {
    const hashObj = crypto.createHash(hashFunction).update(input);
    if (hashSalt) hashObj.update(hashSalt);
    const fullHash = hashObj.digest(hashDigest);
    return { fullHash, shortHash: fullHash.substr(0, hashDigestLength) };
};


const expectAssetsNameToContainHash = (stats, filter = () => true) => {
    const { assets, outputOptions } = stats.compilation;
    const hashFn = makeHashFn(outputOptions);
    expect(Object.keys(assets)).to.have.length.at.least(1);
    Object.keys(assets).filter(filter).forEach((name) => {
        const asset = assets[name];
        const { shortHash } = hashFn(asset.source());
        expect(name).to.contain(shortHash);
    });
};

const webpackCompile = (fixture, mode) => new Promise((resolve, reject) => {
    const dir = path.resolve(__dirname, fixture);
    const config = path.resolve(dir, 'webpack.config.js');
    // eslint-disable-next-line global-require
    const opts = Object.assign(require(config), { mode, context: dir });
    webpack(opts, (err, stats) => {
        if (err) reject(err);
        else resolve(stats);
    });
});

const findAssetByName = (assets, name) => {
    const assetName = Object.keys(assets).map(n => n.split('.')).find(n => n[0] === name).join('.');
    return assets[assetName];
};

const extractHashes = (assets, filter) => Object.keys(assets)
    .map(n => n.split('.'))
    .filter(filter)
    .map(n => n[1]);

describe('OutputHash', () => {
    const modes = ['development', 'production'];

    beforeEach(() => {
        if (fs.existsSync('./test/tmp')) {
            rimraf.sync('./test/tmp');
        }
    });

    modes.forEach((mode) => {
        context(`In ${mode}`, () => {
            it('Works with single entry points', () => webpackCompile('one-asset', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);
                }));

            // Waiting on https://github.com/webpack/webpack/pull/4717
            it('Works with hashSalt', () => webpackCompile('one-asset-salt', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);
                }));

            it('Works with hashFunction (sha256)', () => webpackCompile('one-asset-sha256', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);
                }));

            it('Works with hashDigest (base64)', () => webpackCompile('one-asset-base64', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);
                }));

            it('Works with multiple entry points', () => webpackCompile('multi-asset', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);
                }));

            it('Works with manifest file', () => webpackCompile('manifest', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats);

                    const { compilation: { entrypoints, assets } } = stats;
                    const entryPointNames = Array.from(entrypoints.keys());

                    // Find all the async required assets (i.e. not manifest or entry point chunks)
                    const hashes = extractHashes(assets, n => n[0] !== 'manifest'
                        && entryPointNames.indexOf(n[0]) === -1);
                    const commons = findAssetByName(assets, 'manifest');

                    // We expect 1 entry chunk (async.js)
                    expect(hashes).to.have.lengthOf(1);
                    hashes.forEach((hash) => {
                        expect(commons.source()).to.contain(hash);
                    });
                }));

            it('Works with HTML output', () => webpackCompile('html', mode)
                .then((stats) => {
                    expectAssetsNameToContainHash(stats, name => name !== 'index.html');

                    const hashes = extractHashes(stats.compilation.assets, n => n[0] !== 'index');
                    const commons = findAssetByName(stats.compilation.assets, 'index');

                    expect(hashes).to.have.lengthOf(2);
                    hashes.forEach((hash) => {
                        expect(commons.source()).to.contain(hash);
                    });
                }));

            it('Works with code splitting', () => webpackCompile('code-split', mode)
                .then((stats) => {
                    const main = findAssetByName(stats.compilation.assets, 'main');
                    const onDemandChunk = stats.compilation.chunks.filter(c => c.name === null)[0];

                    // Source code uses new hash for on-demand chunk
                    expect(main.source())
                        .to.contain(onDemandChunk.renderedHash);
                }));

            it('Works with runtime chunks', () => webpackCompile('runtime-chunks', mode)
                .then((stats) => {
                    const onDemandChunk = stats.compilation.chunks.filter(c => c.name === null)[0];

                    // Source code uses new hash for on-demand chunk
                    const runtime1 = findAssetByName(stats.compilation.assets, 'runtime~entry1');
                    const runtime2 = findAssetByName(stats.compilation.assets, 'runtime~entry1');
                    expect(runtime1.source())
                        .to.contain(onDemandChunk.renderedHash);
                    expect(runtime2.source())
                        .to.contain(onDemandChunk.renderedHash);
                }));

            it('Works with sourcemaps', () => webpackCompile('sourcemap', mode)
                .then((stats) => {
                    const { compilation: { entrypoints, assets } } = stats;
                    const entryPointNames = Array.from(entrypoints.keys());

                    // Check the hash is valid for all non-source map files
                    expectAssetsNameToContainHash(stats, asset => asset.indexOf('.map') === -1);

                    entryPointNames.forEach((entryPoint) => {
                        const entryPointAssets = Object.keys(assets).filter(
                            key => key.includes(entryPoint)
                        );

                        // We expect an asset file along with a single source map
                        expect(entryPointAssets.length).to.equal(2);

                        const sourceMap = entryPointAssets.find(
                            assetName => assetName.indexOf('.map') !== -1
                        );

                        const assetKey = entryPointAssets.find(
                            assetName => assetName.indexOf('.map') === -1
                        );

                        // Source code still points to the old sourcemap
                        expect(assets[assetKey].source())
                            .to.contain(`sourceMappingURL=${sourceMap}`);

                        // But sourcemaps has the name of the new source code file
                        expect(assets[sourceMap].source())
                            .to.contain(assetKey);
                    });
                }));
        });
    });
});
