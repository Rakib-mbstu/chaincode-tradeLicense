"use strict";

// Deterministic JSON.stringify()
const stringify = require("json-stringify-deterministic");
const sortKeysRecursive = require("sort-keys-recursive");
const { Contract } = require("fabric-contract-api");
// class licenseInfo{
//     constructor(name,proprietor,contact){
//         this.name = name;
//         this.proprietor = proprietor;
//         this.contact = contact;
//     }
//     showInfo(){
//         return this.name + " " + this.proprietor + " " + this.contact;
//     }
// }

class TradeLicense extends Contract {
  async InitLedger(ctx) {
    const licenses = [
      {
        ID: "1",
        Name: "dsi",
        Proprietor: "MMM",
        Remarks: "None",
        Certifier: "Org1",
      },
    ];

    for (const license of licenses) {
      license.docType = "license";
      // example of how to write to world state deterministically
      // use convetion of alphabetic order
      // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
      // when retrieving data, in any lang, the order of data will be the same and consequently also the corresonding hash
      await ctx.stub.putState(
        license.ID,
        Buffer.from(stringify(sortKeysRecursive(license)))
      );
    }
  }
  // CreateLicense issues a new license to the world state with given details.
  async CreateLicense(ctx, id, name, proprietor, remarks) {
    const exists = await this.LicenseExists(ctx, id);
    if (exists) {
      throw new Error(`The asset ${id} already exists`);
    }

    const license = [
      {
        ID: id,
        Name: name,
        Proprietor: proprietor,
        Remarks: remarks,
        Certifier: ctx.clientIdentity.getID(),
      },
    ];
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    await ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(license)))
    );
    return JSON.stringify(license);
  }
  //check if any license exists with the id
  async LicenseExists(ctx, id) {
    const assetJSON = await ctx.stub.getState(id);
    return assetJSON && assetJSON.length > 0;
  }
  //read license
  async ReadAsset(ctx, id) {
    const assetJSON = await ctx.stub.getState(id); // get the asset from chaincode state
    if (!assetJSON || assetJSON.length === 0) {
      throw new Error(`The asset ${id} does not exist`);
    }
    return assetJSON.toString();
  }

  // UpdateAsset updates an existing asset in the world state with provided parameters.
  async UpdateLicense(ctx, id, proprietor, name, remarks) {
    const exists = await this.LicenseExists(ctx, id);
    if (!exists) {
      throw new Error(`The asset ${id} does not exist`);
    }

    // overwriting original asset with new asset
    const updatedLicense = {
      ID: id,
      Name: name,
      Proprietor: proprietor,
      Remarks: remarks,
      Certifier: ctx.clientIdentity.getID(),
    };
    // we insert data in alphabetic order using 'json-stringify-deterministic' and 'sort-keys-recursive'
    return ctx.stub.putState(
      id,
      Buffer.from(stringify(sortKeysRecursive(updatedLicense)))
    );
  }

  // GetAllLicenses returns all assets found in the world state.
  async GetAllLicenses(ctx) {
    const allResults = [];
    // range query with empty string for startKey and endKey does an open-ended query of all assets in the chaincode namespace.
    const iterator = await ctx.stub.getStateByRange("", "");
    let result = await iterator.next();
    while (!result.done) {
      const strValue = Buffer.from(result.value.value.toString()).toString(
        "utf8"
      );
      let record;
      try {
        record = JSON.parse(strValue);
      } catch (err) {
        console.log(err);
        record = strValue;
      }
      allResults.push(record);
      result = await iterator.next();
    }
    return JSON.stringify(allResults);
  }
}
module.exports = TradeLicense;
