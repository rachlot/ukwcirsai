import { parseDiff, Diff, Hunk } from 'react-diff-view';
import 'react-diff-view/style/index.css';

/**
 * Visualize "git --diff" output
 * 
 * taken from https://github.com/otakustay/react-diff-view#render-diff-hunks
 */
export const DiffViewer = ({ diffText }: { diffText: string }) => {
    const files = parseDiff(diffText);

    const renderFile = ({ oldRevision, newRevision, type, hunks }: any) => (
        <Diff key={oldRevision + '-' + newRevision} viewType="split" diffType={type} hunks={hunks}>
            {hunks => hunks.map(hunk => <Hunk key={hunk.content} hunk={hunk} />)}
        </Diff>
    );

    return (
        <div>
            {files.map(renderFile)}
        </div>
    );
};