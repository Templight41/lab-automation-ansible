import yaml from 'js-yaml';

interface HostConfig {
    ansible_user: string | undefined;
    ansible_ssh_pass: string | undefined;
    ansible_become: boolean;
    ansible_become_pass: string | undefined;
    ansible_become_user: string | undefined;
}

interface Inventory {
    all: {
        hosts: Record<string, HostConfig>;
    };
}

export const toYaml = (data: Array<any>, credentials: Array<any>) => {
    const inventoryContent: Inventory = {
        all: {
            hosts: {}
        }
    };
    console.log(data);
    console.log(credentials);

    data.forEach(item => {
        if (item.address && !inventoryContent.all.hosts[item.address]) {
            inventoryContent.all.hosts[item.address] = {
                ansible_user: credentials.find(user => user.lab === item.lab)?.username,
                ansible_ssh_pass: credentials.find(user => user.lab === item.lab)?.password,
                ansible_become: true,
                ansible_become_pass: credentials.find(user => user.lab === item.lab)?.password,
                ansible_become_user: credentials.find(user => user.lab === item.lab)?.username
            };
        }
    });

    return yaml.dump(inventoryContent);
};

