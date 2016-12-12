import React from 'react';
import Relay from 'react-relay';

class Index extends React.Component {
  render() {
    return (
      <div>
        <h1>Kubernetes Nodes</h1>
        {this.props.root.kubeNodes.edges.map(
          node =>
            <div>{node.node.metadata.name}</div>
          )}
      </div>
    );
  }
}

// The root queries for the main site
export default Relay.createContainer(Index, {
  fragments: {
    root: () => Relay.QL`
      fragment on RootType {
        kubeNodes(first: 10) {
          edges {
            node {
              metadata {
                name
              }
            }
          }
        }
      }
    `,
  },
});
