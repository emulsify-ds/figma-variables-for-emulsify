import { h } from 'preact';
import { useEffect, useState } from 'preact/hooks'
import { emit } from '@create-figma-plugin/utilities'
import { render, Container, Text, VerticalSpace, Button } from '@create-figma-plugin/ui'
import backgroundTexture from './assets/wave-background.png'
import '!./ui.css'

interface PluginMessage {
  type: 'complete' | 'variables' | 'copy';
  variables?: object;
  text?: string;
}

function Plugin() {
  const [isLoading, setIsLoading] = useState(false)
  const [showToast, setShowToast] = useState(false)
  const [variables, setVariables] = useState<object | null>(null)

  useEffect(() => {
    if (variables !== null) {
      handleGetVariables()
    }
  }, [])

  const handleGetVariables = () => {
    setIsLoading(true)
    setVariables(null)
    parent.postMessage({ 
      pluginMessage: { 
        type: 'variables',
      } 
    }, '*')
  }

  const handleCopy = async (text: string) => {
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // Fallback for environments where clipboard API isn't available
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  const handlePluginMessage = (message: PluginMessage) => {
    switch (message.type) {
      case 'complete':
        setIsLoading(false);
        break;
      case 'variables':
        if (message.variables) {
          setVariables(message.variables);
        }
        break;
      case 'copy':
        if (message.text) handleCopy(message.text);
        break;
    }
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      handlePluginMessage(event.data.pluginMessage as PluginMessage);
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => {
        setShowToast(false)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [showToast])

  const handleCopyClick = () => {
    parent.postMessage({ 
      pluginMessage: { 
        type: 'copy-to-clipboard', 
        text: getVariablesIntoJSON(variables!)
      } 
    }, '*');
    setShowToast(true);
  };

  const getVariablesIntoJSON = (variables: object) => 
    `const variables = ${JSON.stringify(variables, null, 2)};`;

  const styles = {
    wrapper: {
      height: '100vh',
      display: 'flex',
      flexDirection: 'column',
      padding: '16px',
      backgroundImage: `
        linear-gradient(180deg, rgba(0, 127, 182, 0.00) 18.75%, #007FB6 63.35%),
        url(${backgroundTexture})
      `,
      backgroundColor: '#007FB6',
      backgroundRepeat: 'repeat',
      backgroundPosition: 'bottom center',
      backgroundSize: '100% auto',
    },
  };

  return (
     <Container space='medium' style={styles.wrapper}>
        <Text className="header">Export Variables for Emulsify</Text>
          {isLoading ? (
            <Button loading onClick={handleGetVariables}>
              Loading
            </Button>
          ) : (
            <div>
              <button className="button" onClick={handleGetVariables}>{variables === null ? 'Get variables' : 'Refresh'}</button>
              {variables && (
                <div>
                  <VerticalSpace space='medium' />
                  <div className="relative">
                    <button 
                      onClick={handleCopyClick}
                      title="Copy to clipboard"
                      className="copy-button"
                    >
                      Copy
                     <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                      </svg>
                    </button>
                    <pre className="copy-output">
                      {getVariablesIntoJSON(variables)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          )}
    </Container>
  );
}

export default render(Plugin)
