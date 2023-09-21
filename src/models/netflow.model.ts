import mongoose, { Document, Schema } from "mongoose";

interface INetflow {
  flow_id: number;
  observation_time_milliseconds: string;
  source_ipv4_address: string;
  xlate_source_port: number;
  firewall_event: number;
  type: string;
  egress_interface: number;
  egress_acl_id: string;
  xlate_destination_port: number;
  octet_total_count: number;
  xlate_destination_address_ip_v4: string;
  icmp_type_ipv4: number;
  source_transport_port: number;
  fw_ext_event: number;
  exporter: {
    uptime_millis: number;
    version: number;
    source_id: number;
    address: string;
    timestamp: string;
  };
  ingress_interface: number;
  flow_start_milliseconds: string;
  protocol_identifier: number;
  icmp_code_ipv4: number;
  username: string;
  destination_transport_port: number;
  destination_ipv4_address: string;
  xlate_source_address_ip_v4: string;
  ingress_acl_id: string;
}

interface IEvent {
  created: string;
  kind: string;
  category: string[];
  type: string[];
  action: string;
}

interface IHost {
  name: string;
}

interface IFlow {
  id: string;
  locality: string;
}
//
interface ISource {
  ip: string;
  port: number;
  locality: string;
  bytes: number;
}

interface INetwork {
  transport: string;
  community_id: string;
  direction: string;
  iana_number: number;
  bytes: number;
}

interface IAgent {
  ephemeral_id: string;
  version: string;
  id: string;
  type: string;
  name: string;
}

interface IRelated {
  ip: string[];
}

interface IDestination {
  ip: string;
  port: number;
  locality: string;
}

interface IFields {
  source: string;
}

interface I_Netflow extends Document {
  //   _id: mongoose.Types.ObjectId;
  ecs: {
    version: string;
  };
  "@timestamp": string;
  observer: {
    ip: string;
  };
  input: {
    type: string;
  };
  netflow: INetflow;
  event: IEvent;
  host: IHost;
  tags: string[];
  "@version": string;
  flow: IFlow;
  source: ISource;
  network: INetwork;
  agent: IAgent;
  related: IRelated;
  destination: IDestination;
  fields: IFields;
}

const NetflowSchema = new Schema<I_Netflow>(
  {
    //   _id: mongoose.Schema.Types.ObjectId,
    ecs: {
      version: String,
    },
    "@timestamp": String,
    observer: {
      ip: { type: String },
    },
    input: {
      type: { type: String },
    },
    netflow: {
      flow_id: { type: Number },
      observation_time_milliseconds: { type: String },
      source_ipv4_address: { type: String },
      xlate_source_port: { type: Number },
      firewall_event: { type: Number },
      type: { type: String },
      egress_interface: { type: Number },
      egress_acl_id: { type: String },
      xlate_destination_port: { type: Number },
      octet_total_count: { type: Number },
      xlate_destination_address_ip_v4: { type: String },
      icmp_type_ipv4: { type: Number },
      source_transport_port: { type: Number },
      fw_ext_event: { type: Number },
      exporter: {
        uptime_millis: { type: Number },
        version: { type: Number },
        source_id: { type: Number },
        address: { type: String },
        timestamp: { type: String },
      },
      ingress_interface: { type: Number },
      flow_start_milliseconds: { type: String },
      protocol_identifier: { type: Number },
      icmp_code_ipv4: { type: Number },
      username: { type: String },
      destination_transport_port: { type: Number },
      destination_ipv4_address: { type: String },
      xlate_source_address_ip_v4: { type: String },
      ingress_acl_id: { type: String },
    },
    event: {
      created: { type: String },
      kind: { type: String },
      category: { type: [String] },
      type: { type: [String] },
      action: { type: String },
    },
    host: {
      name: { type: String },
    },
    tags: { type: [String] },
    "@version": { type: String },
    flow: {
      id: { type: String },
      locality: { type: String },
    },
    source: Object,
    network: Object,
    agent: {
      ephemeral_id: { type: String },
      version: { type: String },
      id: { type: String },
      type: { type: String },
      name: { type: String },
    },
    related: { ip: { type: [String] } },
    destination: {
      ip: { type: String },
      locality: { type: String },
      port: { type: Number },
    },
    fields: { source: { type: String } },
  },
  {
    collection: "netflow",
  }
);

export default mongoose.model<I_Netflow>("netflow", NetflowSchema);
