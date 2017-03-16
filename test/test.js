const webpack = require('webpack');
const path = require('path');
const md5 = require('md5');
const expect = require('chai').expect;

const expetAssetsNameToContainHash = (assets, filter = ()=>true) => {
    expect(Object.keys(assets)).to.have.length.at.least(1);
    Object.keys(assets).filter(filter).forEach(name => {
        const asset = assets[name];
        const contentHash = md5(asset.source()).substr(0, 20);
        expect(name).to.contain(contentHash);
    });
}

const webpackCompile = (fixture) => {
    return new Promise((resolve, reject)=> {
        const dir = path.resolve(__dirname, fixture);
        const config = path.resolve(dir, 'webpack.config.js');
        webpack(Object.assign(require(config), {
            context: dir,
        }), (err, stats) => {
            if (err) reject(err);
            else resolve(stats);
        });
    })
}

const findAssetByName = (assets, name) => {
    const assetName = Object.keys(assets).map(n => n.split('.')).find(n => n[0] === name).join('.');
    return assets[assetName];
}

const extractHashes = (assets, filter) => {
  return Object.keys(assets)
    .map(n => n.split('.'))
    .filter(filter)
    .map(n => n[1])
}

describe('OutputHash', () => {
    it("Works with single entry points", () => webpackCompile('one-asset')
        .then((stats) => {
            expetAssetsNameToContainHash(stats.compilation.assets);
        })
    )

    it("Works with multiple entry points", () => webpackCompile('multi-asset')
        .then((stats) => {
            expetAssetsNameToContainHash(stats.compilation.assets);
        })
    )

    it("Works with common chunks", () => webpackCompile('common-chunks')
        .then((stats) => {
            expetAssetsNameToContainHash(stats.compilation.assets);

            const hashes = extractHashes(stats.compilation.assets, n => n[0]!=="vendor")
            const commons = findAssetByName(stats.compilation.assets, "vendor");

            expect(hashes).to.have.lengthOf(1);
            hashes.forEach(hash => {
                expect(commons.source()).to.contain(hash);
            });
        })
    )

    it("Works with manifest file", () => webpackCompile('manifest')
        .then((stats) => {
            expetAssetsNameToContainHash(stats.compilation.assets);

            const hashes = extractHashes(stats.compilation.assets, n => n[0]!=="manifest")
            const commons = findAssetByName(stats.compilation.assets, "manifest");

            expect(hashes).to.have.lengthOf(2);
            hashes.forEach(hash => {
                expect(commons.source()).to.contain(hash);
            });
        })
    )

    it("Works with HTML output", () => webpackCompile('html')
        .then((stats) => {
            expetAssetsNameToContainHash(stats.compilation.assets, name => name!=="index.html");

            const hashes = extractHashes(stats.compilation.assets, n => n[0]!=="index")
            const commons = findAssetByName(stats.compilation.assets, "index");

            expect(hashes).to.have.lengthOf(2);
            hashes.forEach(hash => {
                expect(commons.source()).to.contain(hash);
            });
        })
    )
});