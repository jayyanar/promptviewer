import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AgentTile from '../../../components/AgentTile';
import OrchestrationViewer from '../../../components/OrchestrationViewer';

// Mock data for demo mode
const MOCK_AGENTS = {
  'demo-1': [
    {
      id: 'agent-1-1',
      name: 'Initial Query Classifier',
      role: 'Query Classifier',
      behavior: [
        'Analyze incoming customer queries to determine their nature and urgency',
        'Categorize queries into predefined categories: billing, technical support, product information, etc.',
        'Identify sentiment and urgency level to prioritize responses',
        'Extract key entities and intents from customer messages'
      ],
      constraints: [
        'Do not attempt to resolve issues directly',
        'Maintain strict privacy of customer information',
        'Only classify based on the information provided'
      ],
      examples: [
        'Input: "My account was charged twice this month"\nOutput: Category: Billing, Urgency: High, Sentiment: Concerned',
        'Input: "How do I reset my password?"\nOutput: Category: Technical Support, Urgency: Medium, Sentiment: Neutral'
      ]
    },
    {
      id: 'agent-1-2',
      name: 'Technical Support Specialist',
      role: 'Technical Support Agent',
      behavior: [
        'Provide step-by-step troubleshooting guidance for technical issues',
        'Explain technical concepts in simple, accessible language',
        'Maintain context across multi-turn conversations',
        'Suggest preventative measures to avoid future issues'
      ],
      constraints: [
        'Do not request sensitive account information',
        'Acknowledge limitations when an issue requires human intervention',
        'Verify understanding before proceeding to next troubleshooting steps'
      ],
      examples: [
        'User: "My app keeps crashing when I try to upload photos"\nResponse: "I understand that\'s frustrating. Let\'s troubleshoot this step by step. First, what version of the app are you using? And have you tried restarting your device?"',
        'User: "How do I connect my account to social media?"\nResponse: "I\'d be happy to help you connect your account. To link your social media account, please follow these steps: 1. Go to Settings > Account > Linked Services..."'
      ]
    },
    {
      id: 'agent-1-3',
      name: 'Billing Specialist',
      role: 'Billing Support Agent',
      behavior: [
        'Address billing inquiries with accuracy and clarity',
        'Explain charges, refunds, and billing policies',
        'Provide information about subscription plans and pricing',
        'Guide users through billing-related processes'
      ],
      constraints: [
        'Never share customer billing information across accounts',
        'Do not process refunds without verification',
        'Maintain professional tone even with frustrated customers',
        'Escalate complex billing disputes to human agents'
      ],
      examples: [
        'User: "Why was I charged $19.99 when your website says $14.99?"\nResponse: "I understand your concern about the price difference. The $14.99 price is for our basic plan, while the $19.99 charge indicates you\'re subscribed to our premium plan which includes additional features. Would you like me to explain the differences between these plans?"',
        'User: "I want a refund for last month\'s service"\nResponse: "I\'d be happy to help with your refund request. Could you please share why you\'re requesting a refund? This will help me better assist you with the process."'
      ]
    }
  ],
  'demo-2': [
    {
      id: 'agent-2-1',
      name: 'Methodology Analyzer',
      role: 'Research Methodology Expert',
      behavior: [
        'Analyze research methodologies for validity and reliability',
        'Identify potential methodological flaws or limitations',
        'Suggest alternative approaches or improvements',
        'Evaluate statistical methods and their appropriateness'
      ],
      constraints: [
        'Focus only on methodology, not on results or conclusions',
        'Avoid domain-specific judgments outside methodological concerns',
        'Acknowledge when specialized expertise would be required'
      ],
      examples: [
        'The paper uses a small sample size (n=24) for a quantitative study claiming broad population effects. This raises concerns about statistical power and generalizability. A power analysis should have been conducted to determine appropriate sample size.',
        'The control group design effectively isolates the independent variable, but the lack of blinding introduces potential experimenter bias. Double-blinding would strengthen the methodology.'
      ]
    },
    {
      id: 'agent-2-2',
      name: 'Literature Context Evaluator',
      role: 'Literature Review Specialist',
      behavior: [
        'Assess how thoroughly the paper situates itself within existing literature',
        'Identify significant omissions in literature review',
        'Evaluate citation practices and potential biases',
        'Connect research to broader theoretical frameworks'
      ],
      constraints: [
        'Do not make claims about literature that isn\'t explicitly referenced',
        'Avoid domain-specific judgments outside your expertise',
        'Focus on contextual positioning, not methodological validity'
      ],
      examples: [
        'The paper cites primarily research from 2000-2010, overlooking significant developments in the field over the past decade. Key missing references include Zhang et al. (2018) and Patel (2020) which directly contradict some of the authors\' assumptions.',
        'The literature review presents a balanced view of competing theories, effectively situating this research within ongoing scholarly debates about cognitive processing models.'
      ]
    },
    {
      id: 'agent-2-3',
      name: 'Results Interpreter',
      role: 'Data Analysis Specialist',
      behavior: [
        'Analyze the presentation and interpretation of research results',
        'Identify potential misinterpretations or overstatements',
        'Evaluate whether conclusions are supported by the data presented',
        'Suggest alternative interpretations of the findings'
      ],
      constraints: [
        'Base analysis only on the data explicitly presented in the paper',
        'Distinguish between statistical significance and practical significance',
        'Acknowledge limitations in your ability to reanalyze raw data'
      ],
      examples: [
        'The authors claim their intervention had a "significant impact" based on p<0.05, but the effect size (Cohen\'s d=0.2) indicates only a small practical effect. This nuance should be acknowledged in their conclusions.',
        'Figure 3 shows clear outliers that may be driving the reported correlation. Without these outliers, the relationship appears much weaker, suggesting the need for robust statistical methods.'
      ]
    }
  ],
  'demo-3': [
    {
      id: 'agent-3-1',
      name: 'Market Trend Analyzer',
      role: 'Market Research Specialist',
      behavior: [
        'Analyze current market trends and consumer behavior patterns',
        'Identify unmet needs and market gaps',
        'Evaluate competitive landscape and positioning opportunities',
        'Project future market developments based on trend analysis'
      ],
      constraints: [
        'Base analyses on verifiable market data, not speculation',
        'Consider regional and demographic variations in market trends',
        'Acknowledge limitations in predictive accuracy',
        'Avoid making specific financial projections'
      ],
      examples: [
        'Analysis: The smart home market shows 32% annual growth with particular expansion in voice-controlled devices. However, consumer surveys indicate persistent privacy concerns, with 68% of potential buyers citing data security as their primary hesitation.',
        'Competitive analysis: Current market leaders focus on comprehensive ecosystems, leaving an underserved segment seeking modular, privacy-focused solutions that don\'t require full ecosystem buy-in.'
      ]
    },
    {
      id: 'agent-3-2',
      name: 'Technical Feasibility Evaluator',
      role: 'Technical Architect',
      behavior: [
        'Assess technical feasibility of product concepts',
        'Identify potential technical challenges and solutions',
        'Evaluate technology readiness levels',
        'Suggest technical approaches and architectures'
      ],
      constraints: [
        'Consider both current and near-horizon technologies',
        'Acknowledge when specialized engineering expertise would be required',
        'Balance technical idealism with practical implementation concerns',
        'Consider scalability and maintenance implications'
      ],
      examples: [
        'The proposed privacy-focused voice assistant would require on-device processing to minimize cloud dependencies. Current edge AI frameworks like TensorFlow Lite or ONNX Runtime could support this approach with models under 50MB, though wake-word accuracy may be 3-5% lower than cloud-based alternatives.',
        'Implementation would require hardware with dedicated neural processing units to maintain responsiveness while processing locally. Estimated BOM impact: $12-18 per unit at scale.'
      ]
    },
    {
      id: 'agent-3-3',
      name: 'User Experience Designer',
      role: 'UX Specialist',
      behavior: [
        'Evaluate product concepts from user experience perspective',
        'Identify potential friction points and usability challenges',
        'Suggest design approaches to enhance user satisfaction',
        'Consider accessibility and inclusive design principles'
      ],
      constraints: [
        'Prioritize user needs over technical elegance or business goals',
        'Consider diverse user populations and use contexts',
        'Base recommendations on established UX principles and research',
        'Acknowledge when user research would be necessary'
      ],
      examples: [
        'The concept of voice-only interaction presents challenges for users with speech impairments or in noise-sensitive environments. Recommendation: Implement multimodal interaction options including touch interface and visual feedback.',
        'Privacy controls should be surfaced during initial setup and easily accessible thereafter. Research shows that buried privacy settings lead to user distrust and eventual abandonment. Suggested approach: Privacy settings dashboard accessible via dedicated physical button.'
      ]
    }
  ],
  'demo-4': [
    {
      id: 'agent-4-1',
      name: 'Legal Clause Identifier',
      role: 'Legal Document Analyzer',
      behavior: [
        'Identify and categorize key clauses in legal documents',
        'Extract critical terms, conditions, and obligations',
        'Flag unusual or potentially problematic clauses',
        'Maintain a structured inventory of document provisions'
      ],
      constraints: [
        'Do not provide legal advice or interpretations',
        'Maintain strict document confidentiality',
        'Flag ambiguous clauses for human review',
        'Do not make judgments about legal validity or enforceability'
      ],
      examples: [
        'IDENTIFIED: Indemnification clause (Section 8.2) - Unusually broad scope covering "any and all claims" without monetary cap or time limitation.',
        'IDENTIFIED: Termination provision (Section 12.4) - Allows termination by Provider with 30 days notice, but requires Client to provide 90 days notice.'
      ]
    },
    {
      id: 'agent-4-2',
      name: 'Risk Assessment Specialist',
      role: 'Legal Risk Analyst',
      behavior: [
        'Evaluate identified clauses for potential business risks',
        'Assess financial implications of legal provisions',
        'Compare terms against industry standards and best practices',
        'Prioritize risks based on potential impact and likelihood'
      ],
      constraints: [
        'Clearly distinguish between legal and business risk considerations',
        'Acknowledge limitations in specialized industry knowledge',
        'Avoid making definitive predictions about legal outcomes',
        'Base risk assessments on factual analysis, not speculation'
      ],
      examples: [
        'RISK ASSESSMENT: The unlimited liability provision deviates significantly from industry standards, which typically cap liability at contract value or 12 months of fees. Financial exposure is potentially unlimited.',
        'RISK ASSESSMENT: The IP assignment clause is overly broad, potentially claiming ownership of pre-existing client intellectual property. This creates business continuity risk if the agreement terminates.'
      ]
    },
    {
      id: 'agent-4-3',
      name: 'Plain Language Translator',
      role: 'Legal Communication Specialist',
      behavior: [
        'Transform legal language into clear, accessible explanations',
        'Maintain accuracy while improving comprehension',
        'Organize information in logical, user-friendly structures',
        'Use visual aids and examples to illustrate complex concepts'
      ],
      constraints: [
        'Never alter the substantive meaning of legal provisions',
        'Clearly indicate when simplification might not capture nuances',
        'Avoid introducing personal opinions or interpretations',
        'Maintain appropriate level of detail for the intended audience'
      ],
      examples: [
        'LEGAL TEXT: "The party of the first part shall indemnify, defend and hold harmless the party of the second part from and against any and all claims, damages, losses, liabilities, costs or expenses whatsoever..."\n\nPLAIN LANGUAGE: "You (the vendor) must protect us from all costs and legal problems if something goes wrong, including paying for our legal defense, any judgments against us, and our expenses."',
        'LEGAL TEXT: "Force Majeure events include, but are not limited to, acts of God, strikes, lockouts..."\n\nPLAIN LANGUAGE: "Neither party is responsible for delays caused by events outside anyone\'s control, such as natural disasters or labor strikes."'
      ]
    }
  ]
};

const MOCK_PROMPTS = {
  'demo-1': {
    id: 'demo-1',
    title: 'Customer Support Chatbot System',
    content: 'A comprehensive prompt for creating a customer support chatbot system that can handle multiple types of inquiries, route to appropriate departments, and maintain context across conversations.',
    orchestration: {
      flow: `
      graph TD
        A[Initial Query Classifier] -->|Technical Issue| B[Technical Support Specialist]
        A -->|Billing Question| C[Billing Specialist]
        B -->|Billing Related Follow-up| C
        C -->|Technical Related Follow-up| B
      `,
      description: 'The customer support system begins with the Initial Query Classifier agent analyzing incoming queries to determine their nature, urgency, and sentiment. Based on this classification, queries are routed to either the Technical Support Specialist or Billing Specialist. These specialized agents can refer queries to each other when conversations cross domains.'
    }
  },
  'demo-2': {
    id: 'demo-2',
    title: 'Research Paper Analysis Framework',
    content: 'A structured approach to analyzing scientific papers across multiple domains, extracting key findings, methodology critiques, and generating follow-up research questions.',
    orchestration: {
      flow: `
      graph TD
        A[Methodology Analyzer] --> D[Results Interpreter]
        B[Literature Context Evaluator] --> D
        D -->|Feedback Loop| A
        D -->|Feedback Loop| B
      `,
      description: 'The research paper analysis framework operates with three specialized agents working in parallel and then synthesizing their findings. The Methodology Analyzer evaluates research design and statistical approaches, while the Literature Context Evaluator assesses how the paper positions itself within existing research. Both feed their analyses to the Results Interpreter, which evaluates the findings and conclusions in light of methodological strengths/weaknesses and literature context.'
    }
  },
  'demo-3': {
    id: 'demo-3',
    title: 'Product Development Brainstorming System',
    content: 'A multi-agent system for product ideation that combines market research, technical feasibility analysis, and user experience considerations to generate innovative product concepts.',
    orchestration: {
      flow: `
      graph TD
        A[Market Trend Analyzer] --> D[Product Concept Synthesizer]
        B[Technical Feasibility Evaluator] --> D
        C[User Experience Designer] --> D
        D -->|Refinement Loop| A
        D -->|Refinement Loop| B
        D -->|Refinement Loop| C
      `,
      description: 'The product development system integrates market insights, technical feasibility, and user experience design in an iterative process. The Market Trend Analyzer identifies opportunities and consumer needs, the Technical Feasibility Evaluator assesses implementation viability, and the UX Designer ensures usability and satisfaction. These perspectives are synthesized into cohesive product concepts, which are then refined through feedback loops with each specialist agent.'
    }
  },
  'demo-4': {
    id: 'demo-4',
    title: 'Legal Document Analysis Framework',
    content: 'A comprehensive system for analyzing legal documents, identifying key clauses, potential risks, and generating plain-language summaries for non-legal stakeholders.',
    orchestration: {
      flow: `
      graph TD
        A[Legal Clause Identifier] --> B[Risk Assessment Specialist]
        B --> C[Plain Language Translator]
        C -->|Clarification Requests| A
      `,
      description: 'The legal document analysis framework follows a sequential process. First, the Legal Clause Identifier extracts and categorizes key provisions from documents. These identified clauses are then evaluated by the Risk Assessment Specialist to determine potential business implications and exposure. Finally, the Plain Language Translator converts both the clauses and their risk assessments into accessible explanations for non-legal stakeholders, with a feedback loop to request clarification on complex provisions.'
    }
  }
};

function AgentsPage() {
  const router = useRouter();
  const { id: promptId } = router.query;
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [prompt, setPrompt] = useState<any>(null);
  const [agents, setAgents] = useState<any[]>([]);
  const [showOrchestration, setShowOrchestration] = useState(false);

  useEffect(() => {
    if (promptId) {
      // Simulate API call with mock data
      setTimeout(() => {
        try {
          const mockPromptId = promptId as string;
          const mockPrompt = MOCK_PROMPTS[mockPromptId];
          const mockAgents = MOCK_AGENTS[mockPromptId] || [];
          
          if (mockPrompt) {
            setPrompt(mockPrompt);
            setAgents(mockAgents);
          } else {
            setError('Prompt not found');
          }
        } catch (err) {
          setError('Failed to load prompt data');
        } finally {
          setLoading(false);
        }
      }, 1000);
    }
  }, [promptId]);

  return (
    <div>
      {loading ? (
        <div className="text-center py-12">
          <div className="spinner"></div>
          <p className="mt-4 text-gray-600">Loading agents...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      ) : (
        <>
          <div className="mb-6">
            <h1 className="text-2xl font-semibold text-gray-900">{prompt?.title || 'Untitled Prompt'}</h1>
            <p className="mt-1 text-sm text-gray-500">
              {prompt?.content?.substring(0, 200)}
              {prompt?.content?.length > 200 ? '...' : ''}
            </p>
            
            <div className="mt-4 flex space-x-4">
              <button
                onClick={() => setShowOrchestration(!showOrchestration)}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {showOrchestration ? 'Hide Orchestration' : 'Show Orchestration'}
              </button>
            </div>
          </div>

          {showOrchestration && prompt?.orchestration && (
            <div className="mb-8">
              <OrchestrationViewer orchestration={prompt.orchestration} agents={agents} />
            </div>
          )}

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {agents.map((agent: any) => (
              <AgentTile
                key={agent.id}
                agent={agent}
                promptId={promptId as string}
              />
            ))}
          </div>

          {agents.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No agents found for this prompt.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AgentsPage;
