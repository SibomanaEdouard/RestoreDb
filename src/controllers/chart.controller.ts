import { Request, Response } from "express";
// import NetflowModel from "../models/netflow.model";
import moment from "moment";
import { MongoClient, Db, MongoClientOptions } from "mongodb";
const ObjectID = require("mongodb").ObjectID;
import DoughnutDataNTS from "../utils/prepare_data_nts";
import DoughnutDataMAT from "../utils/prepare_data_nts";
import { input_params_dict } from "../utils/params";

class ChartController {
  public static async netflownts(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    const params = req.query as any;

    let end_ts = new Date();
    let start_ts = new Date(end_ts.getTime() - params.window * 60 * 60 * 1000); // subtract 'window' hours

    const formatToUTC = (date: any) => {
      return (
        date.getUTCFullYear() +
        "-" +
        String(date.getUTCMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getUTCDate()).padStart(2, "0") +
        "T" +
        String(date.getUTCHours()).padStart(2, "0") +
        ":" +
        String(date.getUTCMinutes()).padStart(2, "0") +
        ":" +
        String(date.getUTCSeconds()).padStart(2, "0") +
        "Z"
      );
    };

    let start_time = formatToUTC(start_ts);
    let end_time = formatToUTC(end_ts);

    let start_date = new Date(start_time);
    let end_date = new Date(end_time);
    console.log(start_time, start_date);
    const num_entries = parseInt(params.num_entries);
    const datafield = params.datafield;
    const db = req.db;
    const initialParams = {
      ...input_params_dict,
      end_time: end_time,
      start_time: start_time,
      start_date: start_date,
      end_date: end_date,
      num_entries: num_entries,
      window: parseInt(params.window),
    };

    let donut;
    let query_start_time = new Date().toISOString();
    try {
      if (
        [
          "network_transport",
          "destination_ip",
          "destination_port",
          "source_ip",
          "source_port",
          "flow_locality",
          "source_locality",
          "destination_locality",
        ].includes(datafield)
      ) {
        donut = await DoughnutDataNTS.single_field_group({
          initialParams,
          datafield,
          db,
        });
      } else if (
        ["source_bytes", "destination_bytes", "network_bytes"].includes(
          datafield
        )
      ) {
        donut = await DoughnutDataNTS.byte_group({
          initialParams,
          datafield,
          db,
        });
      } else if (datafield === "top_talkers") {
        donut = await DoughnutDataNTS.talker_group({
          initialParams,
          datafield,
          db,
        });
      }
      let query_finish_time = new Date().toISOString();

      return res.status(200).json({
        data: donut,
        data_name: datafield,
        start_time: start_time,
        end_time: end_time,
        query_start_time: query_start_time,
        query_finish_time: query_finish_time,
      });
    } catch (error) {
      return res.status(404).json({
        message: "Not Found!",
      });
    }
  }
  public static async netflowmat(
    req: Request,
    res: Response
  ): Promise<Response | undefined> {
    const params = req.query as any;

    let end_ts = new Date();
    let start_ts = new Date(end_ts.getTime() - params.window * 60 * 60 * 1000); // subtract 'window' hours

    const formatToUTC = (date: any) => {
      return (
        date.getUTCFullYear() +
        "-" +
        String(date.getUTCMonth() + 1).padStart(2, "0") +
        "-" +
        String(date.getUTCDate()).padStart(2, "0") +
        "T" +
        String(date.getUTCHours()).padStart(2, "0") +
        ":" +
        String(date.getUTCMinutes()).padStart(2, "0") +
        ":" +
        String(date.getUTCSeconds()).padStart(2, "0") +
        "Z"
      );
    };

    let start_time = formatToUTC(start_ts);
    let end_time = formatToUTC(end_ts);

    let start_date = new Date(start_time);
    let end_date = new Date(end_time);
    console.log(start_time, start_date);
    const num_entries = parseInt(params.num_entries);
    const datafield = params.datafield;
    const db = req.db;
    const initialParams = {
      ...input_params_dict,
      end_time: end_time,
      start_time: start_time,
      start_date: start_date,
      end_date: end_date,
      num_entries: num_entries,
      window: parseInt(params.window),
    };
    let donut;
    let query_start_time = new Date().toISOString();
    try {
      if (
        [
          "network_transport",
          "destination_ip",
          "destination_port",
          "source_ip",
          "source_port",
          "flow_locality",
          "source_locality",
          "destination_locality",
        ].includes(datafield)
      ) {
        donut = await DoughnutDataMAT.single_field_group({
          initialParams,
          datafield,
          db,
        });
      } else if (
        ["source_bytes", "destination_bytes", "network_bytes"].includes(
          datafield
        )
      ) {
        donut = await DoughnutDataMAT.byte_group({
          initialParams,
          datafield,
          db,
        });
      } else if (datafield === "top_talkers") {
        donut = await DoughnutDataMAT.talker_group({
          initialParams,
          datafield,
          db,
        });
      }
      let query_finish_time = new Date().toISOString();

      return res.status(200).json({
        data: donut,
        data_name: datafield,
        start_time: start_time,
        end_time: end_time,
        query_start_time: query_start_time,
        query_finish_time: query_finish_time,
      });
    } catch (error) {
      return res.status(404).json({
        message: "Not Found!",
      });
    }
    return;
  }
}
export default ChartController;
