const React = require('react');
const { shell } = require('electron');
const PT = require('prop-types');
const {
    Button,
    Dialog,
    Intent,
    NumericInput,
    Tooltip,
} = require('@blueprintjs/core');

class Settings extends React.Component {
    static propTypes = {
        isOpen: PT.bool.isRequired,
        onClose: PT.func.isRequired,
        onSave: PT.func.isRequired,
        settings: PT.object.isRequired,
        dataDirPath: PT.string.isRequired,
    };

    constructor(props) {
        super(props);
        this.state = {
            settings: props.settings,
        };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.isOpen && !this.props.isOpen) {
            this.setState({ settings: nextProps.settings });
        }
    }

    render() {
        const { settings } = this.state;

        return (
            <div>
                <Dialog
                    iconName="cog"
                    isOpen={this.props.isOpen}
                    onClose={this.props.onClose}
                    title="Settings"
                >
                    <div className="pt-dialog-body">
                        <div className="pt-form-group pt-inline">
                            <label className="pt-label" htmlFor="server-port">
                                Port
                                {' '}
                                <Tooltip content="Probe is listening on this port for data.">
                                    <span className="pt-icon pt-icon-help" />
                                </Tooltip>
                            </label>
                            <div className="pt-form-content">
                                <NumericInput
                                    id="server-port"
                                    min={1024}
                                    max={65535}
                                    value={settings.serverPort}
                                    onValueChange={val =>
                                        this.setState({
                                            settings: {
                                                ...this.state.settings,
                                                serverPort: val,
                                            },
                                        })}
                                />

                            </div>
                        </div>
                    </div>
                    <div className="pt-dialog-footer">
                        <Button
                            text="Open data directory"
                            onClick={() =>
                                shell.showItemInFolder(
                                    this.props.dataDirPath
                                )}
                        />
                        <div className="pt-dialog-footer-actions">
                            <Button
                                text="Cancel"
                                onClick={this.props.onClose}
                            />
                            <Button
                                intent={Intent.PRIMARY}
                                onClick={() =>
                                    this.props.onSave(this.state.settings)}
                                text="Save"
                            />
                        </div>
                    </div>
                </Dialog>
            </div>
        );
    }
}

module.exports = Settings;
