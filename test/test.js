const crypto = require('crypto');
const webpack = require('webpack');
const path = require('path');
const expect = require('chai').expect;

const expectAssetsNameToContainHash = (stats, filter = () => true) => {
    const { assets } = stats.compilation;
    const { hashFn } = stats;
    expect(Object.keys(assets)).to.have.length.at.least(1);
    Object.keys(assets).filter(filter).forEach((name) => {
        const asset = assets[name];
        const { shortHash } = hashFn(asset.source());
        expect(name).to.contain(shortHash);
    });
};

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

const webpackCompile = fixture => new Promise((resolve, reject) => {
    const dir = path.resolve(__dirname, fixture);
    const config = path.resolve(dir, 'webpack.config.js');
    // eslint-disable-next-line global-require
    const opts = Object.assign(require(config), { context: dir });
    webpack(opts, (err, stats) => {
        // Just attach the hashFn here while we have the outputOptions so we can assert with it.
        stats.hashFn = makeHashFn(opts.output);
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
    it('Works with single entry points', () => webpackCompile('one-asset')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);
        }));

    // Waiting on https://github.com/webpack/webpack/pull/4717
    xit('Works with hashSalt', () => webpackCompile('one-asset-salt')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);
        }));

    it('Works with hashFunction (sha256)', () => webpackCompile('one-asset-sha256')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);
        }));

    it('Works with hashDigest (base64)', () => webpackCompile('one-asset-base64')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);
        }));

    it('Works with multiple entry points', () => webpackCompile('multi-asset')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);
        }));

    it('Works with common chunks', () => webpackCompile('common-chunks')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);

            const hashes = extractHashes(stats.compilation.assets, n => n[0] !== 'vendor');
            const commons = findAssetByName(stats.compilation.assets, 'vendor');

            expect(hashes).to.have.lengthOf(1);
            hashes.forEach((hash) => {
                expect(commons.source()).to.contain(hash);
            });
        }));

    it('Works with manifest file', () => webpackCompile('manifest')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);

            const hashes = extractHashes(stats.compilation.assets, n => n[0] !== 'manifest');
            const commons = findAssetByName(stats.compilation.assets, 'manifest');

            expect(hashes).to.have.lengthOf(2);
            hashes.forEach((hash) => {
                expect(commons.source()).to.contain(hash);
            });
        }));

    it('Works with a complex uglified project', () => webpackCompile('manifest-uglify')
        .then((stats) => {
            expectAssetsNameToContainHash(stats);

            const hashes = extractHashes(stats.compilation.assets, n => n[0] !== 'manifest');
            const commons = findAssetByName(stats.compilation.assets, 'manifest');

            expect(hashes).to.have.lengthOf(2);
            hashes.forEach((hash) => {
                expect(commons.source()).to.contain(hash);
            });
        }));

    it('Works with HTML output', () => webpackCompile('html')
        .then((stats) => {
            expectAssetsNameToContainHash(stats, name => name !== 'index.html');

            const hashes = extractHashes(stats.compilation.assets, n => n[0] !== 'index');
            const commons = findAssetByName(stats.compilation.assets, 'index');

            expect(hashes).to.have.lengthOf(2);
            hashes.forEach((hash) => {
                expect(commons.source()).to.contain(hash);
            });
        }));

    it('Works with sourcemaps', () => webpackCompile('sourcemap')
        .then((stats) => {
            const assets = stats.compilation.assets;

            // New hash
            expect(assets).to.have.property('entry.d36dd5d3312b77a32d66.js');

            // Sourcemap still uses the old hash
            expect(assets).to.have.property('entry.c72f41ea29f35ab86a6b.js.map');

            // Source code still points to the old sourcemap
            expect(assets['entry.d36dd5d3312b77a32d66.js'].source())
                .to.contain('sourceMappingURL=entry.c72f41ea29f35ab86a6b.js.map');

            // But sourcemaps has the name of the new source code file
            expect(assets['entry.c72f41ea29f35ab86a6b.js.map'].source())
                .to.contain('entry.d36dd5d3312b77a32d66.js');
        }));

    it('Works with code splitting', () => webpackCompile('code-split')
        .then((stats) => {
            const main = findAssetByName(stats.compilation.assets, 'main');
            const onDemandChunk = stats.compilation.chunks.filter(c => c.name === null)[0];

            // Source code uses new hash for on-demand chunk
            expect(main.source())
                .to.contain(onDemandChunk.renderedHash);
        }));
});
