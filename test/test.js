const crypto = require('crypto');
const webpack = require('webpack');
const path = require('path');
const { expect } = require('chai');
const rimraf = require('rimraf');
const fs = require('fs');
const sinon = require('sinon');

// Each compilation may use a different hash fn, so we need to generate one from the webpack
// outputOptions.
const makeHashFn = ({
    hashFunction = 'md5',
    hashDigest = 'hex',
    hashDigestLength = 20,
    hashSalt = null,
} = {}) => input => {
    const hashObj = crypto.createHash(hashFunction).update(input);
    if (hashSalt) hashObj.update(hashSalt);
    const fullHash = hashObj.digest(hashDigest);
    return { fullHash, shortHash: fullHash.substr(0, hashDigestLength) };
};

const expectAssetNameToContainContentHash = stats => {
    const isSecondaryFile = file => file.endsWith('.map') || file.endsWith('.html');
    const { assets, outputOptions } = stats.compilation;
    const hashFn = makeHashFn(outputOptions);
    expect(Object.keys(assets)).to.have.length.at.least(1);
    Object.keys(assets)
        .filter(file => !isSecondaryFile(file))
        .forEach(name => {
            const asset = assets[name];
            const { shortHash } = hashFn(asset.source());
            expect(name).to.contain(shortHash);
        });
};

const expectSourcemapsToBeCorrect = stats => {
    const { assets } = stats.compilation;

    Object.keys(assets)
        .filter(name => name.endsWith('.map'))
        .forEach(name => {
            const content = assets[name];
            const linkedFile = JSON.parse(content.source()).file;
            expect(Object.keys(assets)).to.include(linkedFile);
            expect(assets[linkedFile].source()).to.have.string(name);
        });
};

const sanityCheck = stats => {
    expectAssetNameToContainContentHash(stats);
    expectSourcemapsToBeCorrect(stats);
    return stats;
};

const webpackCompile = (fixture, mode, customConfig = config => config) =>
    new Promise((resolve, reject) => {
        const dir = path.resolve(__dirname, fixture);
        const config = path.resolve(dir, 'webpack.config.js');
        // eslint-disable-next-line global-require
        const opts = customConfig(Object.assign(require(config), { mode, context: dir }));
        webpack(opts, (err, stats) => {
            if (err) reject(err);
            else resolve(stats);
        });
    });

const asset = (stats, name, ext = '.js') => {
    const assetName = Object.keys(stats.compilation.assets).find(
        n => n.startsWith(name) && n.endsWith(ext)
    );
    const content = stats.compilation.assets[assetName];
    return {
        hash: assetName.split('.')[1], // By convention the names are <name>.<hash>.<extension>
        content: content.source(),
    };
};

describe('OutputHash', () => {
    const modes = ['development', 'production'];

    before(() => {
        if (fs.existsSync('./test/tmp')) {
            rimraf.sync('./test/tmp');
        }
    });

    afterEach(() => {
        sinon.restore();
    });

    modes.forEach(mode => {
        context(`In ${mode} mode`, () => {
            [true, false].forEach(withFutureEmitAssets => {
                context(`With futureEmitAssets ${withFutureEmitAssets}`, () => {
                    const setFutureEmitAssets = config => {
                        config.output.futureEmitAssets = withFutureEmitAssets;
                        return config;
                    };
                    it('Works with single entry points', () =>
                        webpackCompile('one-asset', mode, setFutureEmitAssets).then(sanityCheck));

                    it('Works with hashSalt', () =>
                        webpackCompile('one-asset-salt', mode, setFutureEmitAssets).then(
                            sanityCheck
                        ));

                    it('Works with hashFunction (sha256)', () =>
                        webpackCompile('one-asset-sha256', mode, setFutureEmitAssets).then(
                            sanityCheck
                        ));

                    it('Works with hashDigest (base64)', () =>
                        webpackCompile('one-asset-base64', mode, setFutureEmitAssets).then(
                            sanityCheck
                        ));

                    it('Works with multiple entry points', () =>
                        webpackCompile('multi-asset', mode, setFutureEmitAssets).then(sanityCheck));

                    it('Works with common chunks', () =>
                        webpackCompile('common-chunk', mode, setFutureEmitAssets).then(
                            sanityCheck
                        ));

                    it('Works with async chunks', () =>
                        webpackCompile('async-chunk', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const main = asset(stats, 'main');
                                const asyncAsset = asset(stats, '0');
                                expect(main.content).to.contain(asyncAsset.hash);
                            }));

                    it('Works with runtime chunks', () =>
                        webpackCompile('runtime-chunk', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const asyncAsset = asset(stats, '0');
                                const runtime1 = asset(stats, 'runtime~entry1');
                                const runtime2 = asset(stats, 'runtime~entry2');

                                expect(runtime1.content).to.contain(asyncAsset.hash);
                                expect(runtime2.content).to.contain(asyncAsset.hash);
                            }));

                    it('Works when runtime has common chunks that require async files', () =>
                        webpackCompile('common-runtime-chunk', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const manifest = asset(stats, 'manifest');
                                const asyncAsset = asset(stats, '0');
                                expect(manifest.content).to.contain(asyncAsset.hash);
                            }));

                    it('Works when there are two async files requiring each other', () =>
                        webpackCompile('loop', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const entry = asset(stats, 'entry');
                                const asyncAsset = asset(stats, '0');
                                expect(entry.content).to.contain(asyncAsset.hash);
                            }));

                    it('Works with shared runtime chunk', () =>
                        webpackCompile('shared-runtime-chunk', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const asyncChunk = asset(stats, 'async');
                                const runtime = asset(stats, 'runtime');
                                expect(runtime.content).to.contain(asyncChunk.hash);
                            }));

                    it('Works with HTML output', () =>
                        webpackCompile('html', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const index = asset(stats, 'index', '.html');
                                const entry = asset(stats, 'entry', '.js');
                                const vendor = asset(stats, 'vendor', '.js');
                                expect(index.content).to.contain(entry.hash);
                                expect(index.content).to.contain(vendor.hash);
                            }));

                    it('Works with mini-css-extract-plugin', () =>
                        webpackCompile('mini-css-chunks', mode, setFutureEmitAssets)
                            .then(sanityCheck)
                            .then(stats => {
                                const runtime = asset(stats, 'runtime~main');
                                const asyncJs = asset(stats, '0', '.js');
                                const asyncCss = asset(stats, '0', '.css');
                                expect(runtime.content).to.contain(asyncJs.hash);
                                expect(runtime.content).to.contain(asyncCss.hash);
                            }));

                    it('Shows a warning if it is not the first plugin in the emit phase', () => {
                        sinon.stub(console, 'warn');
                        return webpackCompile('html-wrong-order', mode, setFutureEmitAssets).then(
                            stats => {
                                expect(console.warn.called).to.be.true;
                            }
                        );
                    });
                });
            });
        });
    });
});
