import * as React from "react";
import styled from "@emotion/styled";

const ErrorMessage = styled.p`
  font-style: italic;
`;

class ErrorBoundary extends React.Component<{}, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorMessage>
          Something went wrong while rendering this cell.
        </ErrorMessage>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
