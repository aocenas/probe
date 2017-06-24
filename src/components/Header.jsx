const path = require('path');
const React = require('react');
const moment = require('moment');
const PT = require('prop-types');
const { Button } = require('@blueprintjs/core');

class Header extends React.Component {
    static propTypes = {
        type: PT.string,
        currentFile: PT.string,
        files: PT.arrayOf(PT.string),
        onFileChange: PT.func.isRequired,
        onTypeChange: PT.func.isRequired,
        onSettingsClick: PT.func.isRequired,
        disabled: PT.bool,
    };

    render() {
        const {
            type,
            currentFile,
            files,
            onTypeChange,
            onFileChange,
            onSettingsClick,
            disabled,
        } = this.props;
        return (
            <div className="header">
                <div className="left-group">
                    <TypeSelect
                        type={type}
                        disabled={disabled}
                        onChange={onTypeChange}
                    />
                    {!disabled &&
                        <DataSelect
                            currentFile={currentFile}
                            files={files}
                            onChange={onFileChange}
                        />
                    }
                </div>
                <Button
                    iconName="cog"
                    className="pt-minimal"
                    onClick={onSettingsClick}
                />
            </div>
        );
    }
}

const DataSelect = ({ currentFile, files, onChange }) => {
    return (
        <div className="pt-select pt-minimal">
            <select
                onChange={event => onChange(event.target.value)}
                value={currentFile}
                disabled={!files}
            >
                {files.map(file => {
                    return (
                        <option key={file} value={file}>
                            {parseFileName(file)}
                        </option>
                    );
                })}
            </select>
        </div>
    );
};

const TypeSelect = ({ type, disabled, onChange }) => {
    return (
        <div className="pt-select pt-minimal">
            <select
                onChange={event => onChange(event.target.value)}
                value={type}
                disabled={disabled}
            >
                <option value="top-down">
                    Tree (top down)
                </option>
                <option value="bottom-up">
                    Heavy (bottom up)
                </option>
                <option value="flame">
                    Flame graph
                </option>
            </select>
        </div>
    );
};

const parseFileName = (fileName: string): string => {
    const parts = path.basename(fileName, '.json').split('_');
    const date = parts[1];
    const name = parts[2];
    const namePart = name ? ` [${name}]` : '';

    return `${moment(date).format('YYYY-MM-DD HH:mm:ss')}${namePart}`;
};

module.exports = Header;
