import React from 'react';
import Relay from 'react-relay';

class EventList extends React.Component {
  render() {
    return (<ul>
      {this.props.events.edges.map(
        event => <li>{event.node.type}: {event.node.message}</li>
      )}
    </ul>);
  }
}

const EventContainer = Relay.createContainer(EventList, {
    fragments: {
        events: () => Relay.QL`
          fragment on EventConnection {
            edges {
              node {
                type
                message
              }
            }
          }
        `,
    }
});

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>Kubernetes Nodes</h1>
        {this.props.root.kubeNodes.edges.map(
          node =>
            <div>{node.node.metadata.name}
            <EventContainer events={node.node.events}></EventContainer>
            </div>
          )}
        <h1>Kubernetes Pods</h1>
        <ul>
        {this.props.root.namespaces.edges.map(
          ns =>
            <li>{ns.node.metadata.name}
              <ul>
                {ns.node.pods.edges.map(
                  pod =>
                  <li>{pod.node.metadata.name}
                    <EventContainer events={pod.node.events}></EventContainer>
                  </li>
                )}
              </ul>
            </li>
        )}
        </ul>
      </div>
    );
  }
}

// The root queries for the main site
export default Relay.createContainer(Index, {
  fragments: {
    root: () => Relay.QL`
      fragment on RootType {
        kubeNodes(first: 100) {
          edges {
            node {
              metadata {
                name
              }
              events(first: 100) {
                ${EventContainer.getFragment('events')}
              }
            }
          }
        }
        namespaces(first: 100) {
          edges {
            node {
              metadata {
                name
              }
              pods(first: 100) {
                edges {
                  node {
                    metadata {
                      name
                    }
                    events(first: 100) {
                      ${EventContainer.getFragment('events')}
                    }
                  }
                }
              }
            }
          }
        }
      }
    `,
  },
});
