import Client from '@app/client';
import { selectFps, selectScreenBuffer } from '@app/reducers';
import withClient from '@app/withClient';
import { ScreenFrameTemplate } from '@templates';
import * as React from 'react';
import { MenuItem, Nav, Navbar, NavDropdown, NavItem } from 'react-bootstrap';
import { connect } from 'react-redux';
import { compose } from 'recompose';
import StreamMessage from 'shared/messages/stream';
import { Monitor } from 'shared/system';

import { ScreenSubscription } from '../Subscription';
import Stream from './Stream';

interface Props {
  client: Client;
  frame: ScreenFrameTemplate;
  fps: number;
}

interface State {
  scale: number;
  running: boolean;
}

class Screen extends React.Component<Props, State> {
  state = {
    scale: 0.1,
    running: true,
  };

  private selectedMonitor: Monitor;

  public componentDidMount() {
    this.selectedMonitor = this.props.client.monitors[0];
    this.stream();
  }

  public componentWillUnmount() {
    this.stop();
  }

  public render() {
    const { frame, fps } = this.props;
    const { scale, running } = this.state;

    return (
      <ScreenSubscription>
        <div style={{ padding: 10 }}>
          <Navbar>
            <Nav>
              <NavItem>Close</NavItem>
              <NavDropdown title={'monitor'} id={'dropdown-size-medium'}>
                {this.props.client.monitors.map(monitor => (
                  <MenuItem
                    key={monitor.id}
                    onClick={() => this.selectMonitor(monitor)}
                  >
                    {monitor.id + ': ' + monitor.width + 'x' + monitor.height}
                  </MenuItem>
                ))}
              </NavDropdown>
              <NavItem>
                <input
                  type="range"
                  min={1}
                  value={scale * 100}
                  max={100}
                  onChange={e => this.setScale(e.target.valueAsNumber)}
                />
              </NavItem>
              <NavItem onClick={() => this.toggle()}>
                {running ? 'Pause' : 'Start'}
              </NavItem>
              <NavItem>{fps} FPS</NavItem>
            </Nav>
          </Navbar>
          <div>
            <Stream
              mouse
              keyboard
              data={frame}
              scale={scale}
              client={this.props.client}
            />
          </div>
        </div>
      </ScreenSubscription>
    );
  }

  private setScale(scale: number) {
    this.setState(
      {
        scale: scale / 100,
      },
      () => {
        this.stop();
        this.stream();
      }
    );
  }

  private selectMonitor(monitor: Monitor) {
    this.selectedMonitor = monitor;
  }

  private toggle() {
    const { running } = this.state;

    if (running) {
      this.stop();
    } else {
      this.stream();
    }
  }

  private stream() {
    const { scale } = this.state;

    this.props.client.send(
      new StreamMessage({
        active: true,
        scale,
        monitor: true,
        handle: this.selectedMonitor.id,
      })
    );

    this.setState({
      running: true,
    });
  }

  private stop() {
    this.props.client.send(
      new StreamMessage({
        active: false,
      })
    );

    this.setState({
      running: false,
    });
  }
}

export default compose(
  connect(state => ({
    frame: selectScreenBuffer(state),
    fps: selectFps(state),
  })),
  withClient
)(Screen);
