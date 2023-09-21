import { Db } from "mongodb";

import _ from "lodash";
import DataUtils from "./data_utils";

import { input_params_dict } from "./params";

class DoughnutDataMAT {
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
              count: { $sum: "$count" },
            },
          },
        ])
        .toArray();
      let data_df = {} as any;
    } catch (err) {}
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
export default DoughnutDataMAT;
