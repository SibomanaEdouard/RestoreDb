import moment from "moment";
import { Db } from "mongodb";

// import NetflowModel from "../models/netflow.model";
import _ from "lodash";
import DataUtils from "./data_utils";

import { input_params_dict } from "./params";
interface IReturnDict {
  count?: number;
  country?: object;
  city?: object;
  destination_mbytes?: object;
  flows?: object;
  location?: object;
  mbytes?: object;
  org?: object;
  source_mbytes?: object;
}
class DoughnutDataNTS {
  static params = { ...input_params_dict } as any;

  public static async single_field_group({
    initialParams,
    datafield,
    db,
  }: {
    initialParams: any;
    datafield: string;
    db: Db;
  }) {
    try {
      const result = await db
        .collection(`nts.${datafield}`)
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: initialParams.start_date,
                $lt: initialParams.end_date,
              },
            },
          },
          {
            $group: {
              _id: "$" + datafield,
              source_bytes: { $sum: "$source_bytes" },
              destination_bytes: { $sum: "$destination_bytes" },
              bytes: { $sum: "$network_bytes" },
              flows: { $sum: "$count" },
            },
          },
        ])
        .toArray();
      let data_df = {} as any;
      // let data_df = await new pd.DataFrame(result);
      // data_df["source_mbytes"] = data_df["source_bytes"] / 1048576;
      // data_df["destination_mbytes"] = data_df["destination_bytes"] / 1048576;
      // data_df["mbytes"] = data_df["bytes"] / 1048576;
      // data_df = await data_df.drop({
      //   columns: ["source_bytes", "destination_bytes", "bytes"],
      //   inplace: true,
      // });
      // console.log(data_df);
      // if (result) {

      let data_df1 = await result.map((row: any) => {
        const new_row = {} as any;
        new_row.source_mbytes = (row.source_bytes / 1048576).toFixed(2);
        new_row.destination_mbytes = (row.destination_bytes / 1048576).toFixed(
          2
        );
        new_row.mbytes = parseFloat((row.bytes / 1048576).toFixed(2));
        new_row.flows = row.flows;
        new_row.label = [
          "flow_locality",
          "source_locality",
          "destination_locality",
        ].includes(datafield)
          ? row._id === "e"
            ? "External"
            : "Internal"
          : row._id;

        return new_row;
      });
      data_df = [...data_df1];

      // let data_df2 = await pd.DataFrame(data_df);
      // data_df = data_df2;

      let data_dict = {} as any;

      let count = data_df.length;
      data_dict.count = count;
      let total_flows = 0 as number;
      if (data_df && Array.isArray(data_df)) {
        total_flows = await data_df.reduce(
          (acc: any, curr: any) => parseFloat(acc) + parseFloat(curr.flows),
          0
        );
      }
      initialParams.total_flows = total_flows;

      const total_mbytes = await data_df.reduce(
        (acc: any, curr: any) => parseFloat(acc) + parseFloat(curr.mbytes),
        0
      );
      initialParams.total_mbytes = total_mbytes;

      const total_source_mbytes = await data_df.reduce(
        (acc: any, curr: any) =>
          parseFloat(acc) + parseFloat(curr.source_mbytes),
        0
      );
      initialParams["total_source_mbytes"] = total_source_mbytes;

      const total_destination_mbytes = await data_df.reduce(
        (acc: any, curr: any) =>
          parseFloat(acc) + parseFloat(curr.destination_mbytes),
        0
      );
      initialParams["total_destination_mbytes"] = total_destination_mbytes;

      data_df = await data_df.map((row: any) => {
        row["flows_percentage"] = parseFloat(
          ((row["flows"] / total_flows) * 100).toFixed(2)
        );
        row["mbytes_percentage"] = parseFloat(
          ((row["mbytes"] / total_mbytes) * 100).toFixed(2)
        );
        row["source_mbytes_percentage"] = parseFloat(
          ((row["source_mbytes"] / total_source_mbytes) * 100).toFixed(2)
        );
        row["destination_mbytes_percentage"] = parseFloat(
          (
            (row["destination_mbytes"] / total_destination_mbytes) *
            100
          ).toFixed(2)
        );
        return row;
      });
      // return data_df;
      if (["source_ip", "destination_ip"].includes(datafield)) {
        data_df = await DataUtils.geo_data_city(data_df, initialParams);

        data_df = await DataUtils.geo_data_asn(data_df, initialParams);
      }

      // data_df = data_df.map((row: any) => {
      //   delete row.label;

      //   return row;
      // });

      if (["source_ip", "destination_ip"].includes(datafield)) {
        data_dict = await this.set_categories(data_df, data_dict);
      }
      if (data_df.length < initialParams.num_entries) {
        var data_prep = (await this.limit_entries(
          data_df,
          initialParams,
          "mbytes"
        )) as any;
        data_prep = data_prep.reduce((acc: any, cur: any) => {
          acc[cur.label] = cur;
          return acc;
        }, {});
        // let singleObject = data_prep.reduce((accumulator: any, item: any) => {
        //   return { ...accumulator, ...item };
        // }, {});
        // singleObject = Object.fromEntries(
        //   Object.entries(singleObject).sort((a, b) => a[0].localeCompare(b[0]))
        // );

        data_dict["mbytes"] = data_prep;
        return data_dict;
      } else {
        let promises = [
          "source_mbytes",
          "destination_mbytes",
          "mbytes",
          "flows",
        ].map(async (field: string) => {
          let data_prep = await this.limit_entries(
            data_df,
            initialParams,
            field
          );
          // let singleObject = data_prep.reduce((accumulator: any, item: any) => {
          //   return { ...accumulator, ...item };
          // }, {});
          // singleObject = Object.fromEntries(
          //   Object.entries(singleObject).sort((a, b) =>
          //     a[0].localeCompare(b[0])
          //   )
          // );
          data_prep = data_prep.reduce((acc: any, cur: any) => {
            acc[cur.label] = cur;
            return acc;
          }, {});
          data_dict[field] = data_prep;
        });
        await Promise.all(promises);
        return data_dict;
      }
    } catch (err) {
      console.log(err);
      return { error: "error" };
    }
  }
  public static async set_categories(data_df: any, data_dict: any) {
    const categories = ["country", "city", "org"];

    for (let category of categories) {
      let cat_arr = await _.map(data_df, (obj) =>
        _.pick(obj, [
          `${category}_name`,
          "source_mbytes",
          "destination_mbytes",
          "mbytes",
          "flows",
          "flows_percentage",
          "mbytes_percentage",
          "source_mbytes_percentage",
          "destination_mbytes_percentage",
        ])
      );

      let groupedData = (await _.groupBy(cat_arr, `${category}_name`)) as any;
      for (let key in groupedData) {
        groupedData[key] = _.reduce(
          groupedData[key],
          function (result: any, currentObject: any) {
            // if (result[key]) result[key] += currentObject[key];
            for (let key in currentObject) result[key] = currentObject[key];
            return result;
          },
          {}
        );
        groupedData[key].label = key;
      }
      groupedData = Object.fromEntries(
        Object.entries(groupedData).sort((a, b) => a[0].localeCompare(b[0]))
      );
      data_dict[category] = groupedData;
    }
    return data_dict;
  }
  public static async limit_entries(
    data_df: any,
    initialParams: any,
    field: string
  ) {
    let data_prep = data_df
      .sort((a: any, b: any) => b[field] - a[field])
      .slice(0, initialParams.num_entries);
    let top_source_mbytes = data_prep.reduce(
      (accumulator: any, currentValue: any) =>
        accumulator + currentValue["source_mbytes"],
      0
    );
    let top_destination_mbytes = data_prep.reduce(
      (accumulator: any, currentValue: any) =>
        accumulator + currentValue["destination_mbytes"],
      0
    );
    let top_mbytes = data_prep.reduce(
      (accumulator: any, currentValue: any) =>
        accumulator + currentValue["mbytes"],
      0
    );
    let top_flows = data_prep.reduce(
      (accumulator: any, currentValue: any) =>
        accumulator + currentValue["flows"],
      0
    );
    let other_mbytes = this.params["total_mbytes"] - top_mbytes;

    if (other_mbytes > 0) {
      data_prep.push({
        others: {
          source_mbytes: this.params["total_source_mbytes"] - top_source_mbytes,
          source_mbytes_percentage: Math.round(
            ((this.params["total_source_mbytes"] - top_source_mbytes) /
              this.params["total_source_mbytes"]) *
              100
          ).toFixed(2),
          destination_mbytes:
            this.params["total_destination_mbytes"] - top_destination_mbytes,
          destination_mbytes_percentage: (
            ((this.params["total_destination_mbytes"] -
              top_destination_mbytes) /
              this.params["total_destination_mbytes"]) *
            100
          ).toFixed(2),
          mbytes: other_mbytes,
          mbytes_percentage: Math.round(
            ((this.params["total_mbytes"] - top_mbytes) /
              this.params["total_mbytes"]) *
              100
          ).toFixed(2),
          flows: this.params["total_flows"] - top_flows,
          flows_percentage: Math.round(
            ((this.params["total_flows"] - top_flows) /
              this.params["total_flows"]) *
              100
          ).toFixed(2),
        },
      });

      [
        "country_name",
        "city_name",
        "org_name",
        "latitude",
        "longitude",
      ].forEach((header) => {
        if (header in data_prep.columns) {
          data_prep[data_prep.length - 1]["others"][header] =
            "No data for " + header;
        }
      });
    }

    ["source_mbytes", "destination_mbytes", "mbytes", "flows"].forEach(
      (data_field) => {
        data_prep.forEach((item: any) => {
          item[data_field] = parseInt(item[data_field]);
        });
      }
    );
    return data_prep;
    // let data_prep = _.take(
    //   _.orderBy(data_df, [field], ["desc"]),
    //   initialParams.num_entries
    // );

    // // Calculate various sums
    // let top_source_mbytes = (await _.sumBy(data_prep, "source_mbytes")) as any;
    // let top_destination_mbytes = (await _.sumBy(
    //   data_prep,
    //   "destination_mbytes"
    // )) as any;
    // let top_mbytes = (await _.sumBy(data_prep, "mbytes")) as any;
    // top_mbytes = top_mbytes.toFixed(2);
    // let top_flows = (await _.sumBy(data_prep, "flows")) as any;
    // top_flows = top_flows.toFixed(2);

    // let other_mbytes = initialParams.total_mbytes - top_mbytes;
    // console.log(other_mbytes);
    // if (parseInt(other_mbytes) > 0) {
    //   data_prep = await data_prep.map((row: any) => {
    //     const new_row = {
    //       ...row,
    //       source_mbytes:
    //         parseFloat(initialParams.total_source_mbytes) -
    //         parseFloat(top_source_mbytes),
    //       source_mbytes_percentage: (
    //         ((parseFloat(initialParams.total_source_mbytes) -
    //           parseFloat(top_source_mbytes)) /
    //           parseFloat(initialParams.total_source_mbytes)) *
    //         100
    //       ).toFixed(2),
    //       destination_mbytes:
    //         parseFloat(initialParams.total_destination_mbytes) -
    //         parseFloat(top_destination_mbytes),
    //       destination_mbytes_percentage: (
    //         ((parseFloat(initialParams.total_destination_mbytes) -
    //           parseFloat(top_destination_mbytes)) /
    //           parseFloat(initialParams.total_destination_mbytes)) *
    //         100
    //       ).toFixed(2),
    //       mbytes: other_mbytes,
    //       mbytes_percentage: (
    //         ((parseFloat(initialParams.total_mbytes) - parseFloat(top_mbytes)) /
    //           parseFloat(initialParams.total_mbytes)) *
    //         100
    //       ).toFixed(2),
    //       flows: parseFloat(initialParams.total_flows) - parseFloat(top_flows),
    //       flows_percentage: (
    //         ((parseFloat(initialParams.total_flows) - parseFloat(top_flows)) /
    //           parseFloat(initialParams.total_flows)) *
    //         100
    //       ).toFixed(2),
    //     };
    //     return new_row;
    //   });

    //   // Create an 'others' object with data
    //   const others = {} as any;
    //   others.source_mbytes =
    //     initialParams.total_source_mbytes - top_source_mbytes;
    //   others.source_mbytes_percentage = (
    //     ((initialParams.total_source_mbytes - top_source_mbytes) /
    //       initialParams.total_source_mbytes) *
    //     100
    //   ).toFixed(2);
    //   others.destination_mbytes =
    //     initialParams.total_destination_mbytes - top_destination_mbytes;
    //   others.destination_mbytes_percentage = (
    //     ((initialParams.total_destination_mbytes - top_destination_mbytes) /
    //       initialParams.total_destination_mbytes) *
    //     100
    //   ).toFixed(2);
    //   others.mbytes = other_mbytes;
    //   others.mbytes_percentage = (
    //     ((initialParams.total_mbytes - top_mbytes) /
    //       initialParams.total_mbytes) *
    //     100
    //   ).toFixed(2);
    //   others.flows = initialParams.total_flows - top_flows;
    //   others.flows_percentage = (
    //     ((initialParams.total_flows - top_flows) / initialParams.total_flows) *
    //     100
    //   ).toFixed(2);
    // for (let header of [
    //   "country_name",
    //   "city_name",
    //   "org_name",
    //   "latitude",
    //   "longitude",
    // ]) {
    //   if (header in data_prep[0]) {
    //     // assuming all objects in data_prep have same structure
    //     others[header] = `No data for ${header}`;
    //   }
    // }
    // // Push the 'others' object to data_prep
    // data_prep.push(others);
    // }

    // Convert number fields to integers, then you can validate the conversion according to your needs.
    // for (let obj of data_prep) {
    //   for (let field of [
    //     "source_mbytes",
    //     "destination_mbytes",
    //     "mbytes",
    //     "flows",
    //     "flows_percentage",
    //     "mbytes_percentage",
    //     "source_mbytes_percentage",
    //     "destination_mbytes_percentage",
    //   ]) {
    //     obj[field] = obj[field] === "NaN" ? null : parseFloat(obj[field]);
    //   }
    // }
    // data_prep = await data_prep.map((row: any) => {
    //   return { [row.label]: row };
    // });

    // return data_prep;
  }
  public static async talker_group({
    initialParams,
    datafield,
    db,
  }: {
    initialParams: any;
    datafield: string;
    db: Db;
  }) {
    let collection_name;
    let ip_addresses: any[] = [];
    let destination_field = "destination";
    let source_field = "source";
    if (initialParams.database_type === "timeseries") {
      collection_name = initialParams["collection_name"];
    } else {
      collection_name = initialParams["structured_collection_name"];
    }
    try {
      const result = await db
        .collection(`nts.${datafield}`)
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: initialParams.start_date,
                $lt: initialParams.end_date,
              },
            },
          },
          {
            $group: {
              _id: {
                source_ip: "$source_ip",
                destination_ip: "$destination_ip",
              },
              source_bytes: { $sum: "$source_bytes" },
              destination_bytes: { $sum: "$destination_bytes" },
              network_bytes: { $sum: "$network_bytes" },
            },
          },
          {
            $project: {
              _id: 0,
              source_ip: "$_id.source_ip",
              destination_ip: "$_id.destination_ip",
              source_bytes: "$source_bytes",
              destination_bytes: "$destination_bytes",
              network_bytes: "$network_bytes",
            },
          },
        ])
        .toArray();

      let talkers = result;
      let data: any = {};
      data.top_network_talkers = _.take(
        _.orderBy(talkers, ["network_bytes"], ["desc"]),
        initialParams.num_entries
      );
      data.top_destination_talkers = _.take(
        _.orderBy(talkers, ["destination_bytes"], ["desc"]),
        initialParams.num_entries
      );
      data.top_source_talkers = _.take(
        _.orderBy(talkers, ["source_bytes"], ["desc"]),
        initialParams.num_entries
      );
      await data.top_network_talkers.map((ip: any) => {
        ip_addresses.push(ip.destination_ip);
        ip_addresses.push(ip.source_ip);
      });
      await data.top_destination_talkers.map((ip: any) => {
        ip_addresses.push(ip.destination_ip);
        ip_addresses.push(ip.source_ip);
      });
      await data.top_source_talkers.map((ip: any) => {
        ip_addresses.push(ip.destination_ip);
        ip_addresses.push(ip.source_ip);
      });

      let df_dest = await DataUtils.geo_ip_talker_map(
        ip_addresses,
        initialParams,
        destination_field
      );

      let df_source = await DataUtils.geo_ip_talker_map(
        ip_addresses,
        initialParams,
        source_field
      );
      let talker_dict = {} as any;
      let top_network_talkers = await data.top_network_talkers.map(
        (frame: any, index: number) => {
          return {
            ...frame,
            ...df_dest[frame.destination_ip],
            rank: index + 1,
            ...df_source[frame.source_ip],
          };
        }
      );
      // top_network_talkers = top_network_talkers.reduce(
      //   (accumulator: any, item: any) => {
      //     return { ...accumulator, ...item };
      //   },
      //   {}
      // );
      let top_destination_talkers = await data.top_destination_talkers.map(
        (frame: any, index: number) => {
          return {
            ...frame,
            ...df_dest[frame.destination_ip],
            ...df_source[frame.source_ip],
            rank: index + 1,
          };
        }
      );
      // top_destination_talkers = top_destination_talkers.reduce(
      //   (accumulator: any, item: any) => {
      //     return { ...accumulator, ...item };
      //   },
      //   {}
      // );
      let top_source_talkers = await data.top_source_talkers.map(
        (frame: any, index: number) => {
          return {
            ...frame,
            ...df_dest[frame.destination_ip],
            ...df_source[frame.source_ip],
            rank: index + 1,
          };
        }
      );
      // top_source_talkers = top_source_talkers.reduce(
      //   (accumulator: any, item: any) => {
      //     return { ...accumulator, ...item };
      //   },
      //   {}
      // );

      return {
        top_destination_talkers: { ...top_destination_talkers },
        top_network_talkers: { ...top_network_talkers },
        top_source_talkers: { ...top_source_talkers },
      };
    } catch (err) {
      console.log(err);
    }
  }

  public static async byte_group({
    initialParams,
    datafield,
    db,
  }: {
    initialParams: any;
    datafield: string;
    db: Db;
  }) {
    let collection_name;
    if (initialParams.database_type === "timeseries") {
      collection_name = initialParams["collection_name"];
    } else {
      collection_name = initialParams["structured_collection_name"];
    }
    try {
      const result = await db
        .collection(`nts.${datafield}`)
        .aggregate([
          {
            $match: {
              timestamp: {
                $gte: initialParams.start_date,
                $lt: initialParams.end_date,
              },
            },
          },
          { $group: { _id: "$bytes", count: { $sum: "$count" } } },
        ])
        .toArray();

      let output = result;

      let total = _.sumBy(output, "count");

      output.map((item) => {
        item.percentage = _.round((item.count / total) * 100, 2);
        item.label = String(item._id);
        delete item._id;
      });

      output.sort((a, b) => b.percentage - a.percentage);

      let byteBucket: { [key: string]: any } = {};
      output.map((item, index) => {
        byteBucket[`Bytes_${item.label}`] = item;
      });

      return byteBucket;
    } catch (err) {
      console.log(err);
    }
  }
}
export default DoughnutDataNTS;
