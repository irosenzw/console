Feature: Create the pipeline from builder page
    As a user, I want to create the pipeline with different set of series & parallel tasks 

Background:
    Given user has installed OpenShift Pipelines operator
    And user has selected namespace "aut-pipelines-builder"


@regression, @smoke
Scenario: Pipeline Builder page : P-03-TC02
    Given user is at pipelines page 
    When user clicks Create Pipeline button on Pipelines page
    Then user will be redirected to Pipeline Builder page
    And user is able to see pipeline name with default value "new-pipeline"
    And Tasks, Paramters and Resources sections are displayed
    And Edit Yaml link is enabled
    And Create button is in disabled state


@regression
Scenario Outline: Create a pipeline with series tasks : P-07-TC03
    Given user is at Pipeline Builder page 
    When user enters pipeline name as "<pipeline_name>"
    And user selects "<task_name>" from Task drop down
    And user adds another task "<task_name_1>" in series
    And user clicks Create button on Pipeline Builder page
    Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
    And tasks displayed serially in pipelines section

Examples:
| pipeline_name | task_name | task_name_1 |
| p-one         | kn        | Sn          |


@regression, @smoke
Scenario Outline: Create a pipeline with parallel tasks : P-03-TC03, P-07-TC02
    Given user is at Pipeline Builder page 
    When user enters pipeline name as "<pipeline_name>"
    And user selects "<task_name>" from Task drop down
    And user adds another task "<task_name_1>" in parallel
    And user clicks Create button on Pipeline Builder page
    Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
    And tasks displayed parallel in pipelines section

Examples:
| pipeline_name | task_name | task_name_1      |
| p-one         | kn        | openshift-client |


@regression, @smoke
Scenario Outline: Create a basic pipeline from pipeline builder page : P-03-TC08
    Given user is at Pipeline Builder page 
    When user enters pipeline name as "<pipeline_name>"
    And user selects "<task_name>" from Task drop down
    And user clicks Create button on Pipeline Builder page
    Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"

Examples:
| pipeline_name | task_name |
| p-one         | kn        | 


@regression
Scenario Outline: Create pipeline with "<resource_type>" as resource type from pipeline builder page : "<tc_no>"
    Given user is at Pipeline Builder page 
    When user enters pipeline name as "<pipeline_name>"
    And user selects "<task_name>" from Task drop down
    And user adds "<resource_type>" resource with name "<resource_name>" to the "<task_name>"
    And user clicks "Create" button on Pipeline Builder page
    Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
    And task details present in pipeline details section

Examples:
| pipeline_name | task_name        | resource_type | resource_name | tc_no     |
| p-two         | openshift-client | Git           | git repo      | P-03-TC11 |
| p-img         | task-image       | Image         | image repo    | P-03-TC05 |
| p-storage     | task-storage     | Storage       | storage repo  | P-03-TC06 |
| p-cluster     | task-cluster     | Cluster       | cluster repo  | P-03-TC07 |


Scenario: Add Paramters to the pipeline in pipeline builder page : P-03-TC04
    Given user is at Pipeline Builder page 
    When user clicks on "Add Paramters" link
    And user adds the parameter details like Name, Description and Default Value
    And user clicks "Create" button on Pipeline Builder page
    Then user will be redirected to Pipeline Details page with header name "<pipeline_name>"
    And parameter details displayed in parameters section


@regression, @manual
Scenario: Switching from Pipeline builder view to YAML view to see yaml data
    Given user is at Pipeline Builder page
    When user adds "git clone" task
    And user clicks YAML view
    Then user can see "git clone" task present in the YAML view with param values


@regression, @manual
Scenario: Switching from YAML view to Pipeline builder view to see builder data
    Given user is at Pipeline YAML view 
    When user adds "- name: git-clone" under tasks
    And user adds "name: git-clone" and "kind: ClusterTask" under taskRef in tasks section 
    And user clicks Pipeline Builder radio button 
    Then user can see "git clone" tasks present in the Pipeline builder view


@regression, @manual
Scenario: Create the pipeline from yaml editor : P-07-TC01
    Given user is at Pipeline Builder page
    When user clicks YAML view
    And user clicks Continue on Switch to YAML editor
    And user clicks Create button on Pipeline Yaml page
    Then user will be redirected to Pipeline Details page with header name "new-pipeline"
