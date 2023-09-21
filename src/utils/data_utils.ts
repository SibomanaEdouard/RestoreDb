const geoip = require("geoip-lite");
const maxmind = require("maxmind");
class DataUtils {
  public static async geo_data_city(data_df: any, initialParams: any) {
    const cityLookup = await maxmind.open(initialParams.db_city);
    data_df.map(async (row: any) => {
      let ip_address = row.label;
      row.label = String(ip_address);

      try {
        let response = await cityLookup.get(ip_address);
        let latitude, longitude, lat_tuple, country_name, city_name;

        try {
          latitude = String(response.location.latitude);
          longitude = String(response.location.longitude);
        } catch (err) {
          latitude = "No data for latitude";
          longitude = "No data for longitude";
        }

        lat_tuple = `${latitude},${longitude}`;

        try {
          country_name = response.country.names["en"];
        } catch (err) {
          try {
            country_name = initialParams.geo_lookup_dict[lat_tuple][0];
          } catch (err) {
            country_name = "Other Address";
          }
        }

        try {
          city_name = response.city.names["en"];
        } catch (err) {
          try {
            city_name = initialParams.geo_lookup_dict[lat_tuple][1];
          } catch (err) {
            city_name = "Other Address";
          }
        }

        row["country_name"] = String(country_name);
        row["city_name"] = String(city_name);
        row["latitude"] = String(latitude);
        row["longitude"] = String(longitude);
      } catch (err) {
        let ipStart = String(ip_address).substring(0, 3);
        if (
          ["10.", "172", "192"].indexOf(ipStart) !== -1 ||
          (parseInt(ipStart) >= 224 && parseInt(ipStart) <= 240)
        ) {
          row["country_name"] = "Germany";
          row["city_name"] = "Frankfurt am Main";
          row["latitude"] = "50.1188";
          row["longitude"] = "8.6843";
        } else {
          row["country_name"] = "Other Country";
          row["city_name"] = "Other City";
          row["latitude"] = "Other Latitude";
          row["longitude"] = "Other Longitude";
        }
      }
    });

    return data_df;
  }
  public static async geo_data_asn(data_df: any, initialParams: any) {
    const asnLookup = await maxmind.open(initialParams.db_asn);
    data_df.map(async (row: any) => {
      let ip_address = row.label;
      try {
        row.label = String(ip_address);
        const response = asnLookup.get(ip_address);
        let orgName = "Other Organisation";
        if (response.autonomous_system_organization) {
          orgName = response.autonomous_system_organization;
          row["org_name"] = String(orgName);
        }
      } catch (err) {
        if (
          ["10.", "172", "192"].includes(String(ip_address).slice(0, 3)) ||
          (parseInt(ip_address.slice(0, 3)) >= 224 &&
            parseInt(ip_address.slice(0, 3)) < 240)
        ) {
          row["org_name"] = "Racksnet";
        } else {
          row["org_name"] = "Other Organisation";
        }
      }
    });
    return data_df;
  }

  public static async geo_ip_talker_map(
    ipAddresses: any,
    initialParams: any,
    name_field: string
  ) {
    let ipFrame = (await this.buildInitialDataFrame(
      ipAddresses,
      name_field
    )) as any;
    const cityLookup = await maxmind.open(initialParams.db_city);
    const asnLookup = await maxmind.open(initialParams.db_asn);

    for (let ipAddress of ipAddresses) {
      try {
        const cityResponse = await cityLookup.get(ipAddress);
        ipFrame[ipAddress][`${name_field}_country`] =
          cityResponse.country.names["en"] || "Other Country";
        ipFrame[ipAddress][`${name_field}_city`] =
          (await cityResponse.city.names["en"]) || "Other City";
      } catch (error) {
        let ipFirstThree = await ipAddress.slice(0, 3);
        if (
          ["10.", "172", "192"].includes(ipFirstThree) ||
          (parseInt(ipFirstThree) >= 224 && parseInt(ipFirstThree) <= 240)
        ) {
          ipFrame[ipAddress][`${name_field}_country`] = "Germany";
          ipFrame[ipAddress][`${name_field}_city`] = "Frankfurt am Main";
        } else {
          ipFrame[ipAddress][`${name_field}_country`] = "Other Country";
          ipFrame[ipAddress][`${name_field}_city`] = "Other City";
        }
      }

      try {
        const asnResponse = asnLookup.get(ipAddress);
        ipFrame[ipAddress][`${name_field}_org`] =
          asnResponse.autonomous_system_organization || "Other Organization";
      } catch (error) {
        let ipFirstThree = ipAddress.slice(0, 3);
        if (
          ["10.", "172", "192"].includes(ipFirstThree) ||
          (parseInt(ipFirstThree) >= 224 && parseInt(ipFirstThree) <= 240)
        ) {
          ipFrame[ipAddress][`${name_field}_org`] = "Racksnet";
        } else {
          ipFrame[ipAddress][`${name_field}_org`] = "Other Organization";
        }
      }
    }

    return ipFrame;
  }

  public static async buildInitialDataFrame(
    ipAddresses: any,
    name_field: string
  ) {
    let frame = {} as any;
    for (let ipAddress of ipAddresses) {
      frame[ipAddress] = {
        [`${name_field}_country`]: "",
        [`${name_field}_city`]: "",
        [`${name_field}_org`]: "",
      };
    }
    return frame;
  }
}
export default DataUtils;
