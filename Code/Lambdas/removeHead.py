import json, re

def removeHead(url: str) -> str:
    ''' Remove protocol and www from url '''
    pattern = r'^(?:http[s]?:\/{2})?(.*?\.)(.*)$'
    search = re.search(pattern, url)

    if (search):
        if (search.group(1).startswith('http')):
            return ''

        if (search.group(1) == 'www.'):
            return search.group(2)
        return ''.join(search.groups())
    return

def lambda_handler(event, context):
    if  ('url' not in event.keys()):
        return {
            'statusCode': 400,
            'body': json.dumps('URL not provided')
        }
    
    if (len(event.keys()) > 1):
        return {
            'statusCode': 400,
            'body': json.dumps('Provide only URL param')
        }
    
    no_head = removeHead(event['url'])
    
    response = {'headless': no_head}
    
    return {
        'statusCode': 200,
        'body': json.dumps(response)
    }
